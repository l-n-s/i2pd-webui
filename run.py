#! /usr/bin/python3
import http.server
import urllib.request, urllib.error, urllib.parse
import os
from os import sep
import ssl

#For localhost without certificates properly set up
#SSL: CERTIFICATE_VERIFY_FAILED urllib.request.urlopen
#https://www.python.org/dev/peps/pep-0476/
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    # Legacy Python that doesn't verify HTTPS certificates by default
    pass
else:
    # Handle target environment that doesn't support HTTPS verification
    ssl._create_default_https_context = _create_unverified_https_context

#WebUI Settings
listen_port = 8082
server_address = "127.0.0.1"

#i2pd I2PControl port. https is mandatory by i2pcontrol
i2pcontrol_url = "https://127.0.0.1:7650/"

#Alternate solution SSL: CERTIFICATE_VERIFY_FAILED
#gcontext = ssl._create_unverified_context()
gcontext = ssl.SSLContext(ssl.PROTOCOL_TLSv1)
urllib.request.HTTPSHandler(context=gcontext)

__location__ = os.path.realpath(
    os.path.join(os.getcwd(), os.path.dirname(__file__)))

#Fix Chrome can not load page at all
#Fix ERR_INVALID_HTTP_RESPONSE when load css,js,ico files
#Fix css was ignored due to mime type mismatch
def get_header_type(file_path):
    file_types_pairs = [(".js","application/javascript"),(".css","text/css"),
                    (".ico","image/x-icon")]
    file_dict = dict(file_types_pairs)
    filename, file_extension = os.path.splitext(file_path)
    #print(file_extension)
    if file_extension in file_dict:
        return file_dict[file_extension]
    return "text/html"

def resp_html(s):
    """Response to GET requests with actual documents"""
    legal_files = ["/js/lib/underscore-min.js", "/js/app.js", "/js/functions.js",
                    "/css/main.css","/favicon.ico"]

    if s.path == "/":
        s.send_response(200)
        s.send_header("Content-Type", "text/html")
        s.end_headers()
        with open(os.path.join(__location__, "index.html"), 'rb') as f:
            s.wfile.write(f.read())
    elif s.path in legal_files:
        file_path = s.path[1:].replace("/", sep)
        with open(os.path.join(__location__, file_path), 'rb') as f:
            s.send_response(200)
            s.send_header("Content-Type", get_header_type(file_path))
            s.end_headers()
            s.wfile.write(f.read())
    else:
        s.send_error(404, "Not Found")
        print("404 Not Found")

def proxy_request(data, s):
    """Send data to i2pcontrol port and return response"""
    
    req = urllib.request.Request(i2pcontrol_url, data)
    print(("--> sending to i2pcontrol", data))
    try:
        response = urllib.request.urlopen(req)
        s.send_response(200)
        s.send_header("Content-Type", "application/json")
        s.end_headers()
        resp = response.read()
        print(("<-- recieved from i2pcontrol", resp))
        s.wfile.write(resp)
    except urllib.error.URLError as e:
        print(e)
        s.send_error(500, "Cannot connect to I2PControl port" + e)

class MyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(s):
        resp_html(s)

    def do_POST(s):
        content_length = int(s.headers['Content-Length'])
        post_data = s.rfile.read(content_length)
        proxy_request(post_data, s)

if __name__ == "__main__":
    httpd = http.server.HTTPServer((server_address, listen_port), MyHandler)
    try:
        print(("WebUI is listening at http://"+ server_address +":" + str(listen_port)))
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass

    httpd.server_close()
