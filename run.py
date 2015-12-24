#! /usr/bin/python3
import http.server
import urllib.request, urllib.error, urllib.parse
from os import sep
import ssl

listen_port = 8082
i2pcontrol_url = "https://127.0.0.1:7650/"
gcontext = ssl.SSLContext(ssl.PROTOCOL_TLSv1)
urllib.request.HTTPSHandler(context=gcontext)

def resp_html(s):
    """Response to GET requests with actual documents"""
    legal_files = ["/js/lib/underscore-min.js", "/js/app.js", "/favicon.ico",
            "/js/functions.js",
            "/css/main.css"]

    if s.path == "/":
        s.send_response(200)
        s.send_header("Content-Type", "text/html")
        s.end_headers()
        with open("index.html", 'rb') as f:
            s.wfile.write(f.read())
    elif s.path in legal_files:
        file_path = s.path[1:].replace("/", sep)
        with open(file_path, 'rb') as f:
            s.wfile.write(f.read())
    else:
        s.send_error(404, "Not Found")

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
    except urllib.error.URLError:
        s.send_error(500, "Cannot connect to I2PControl port")

class MyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(s):
        resp_html(s)

    def do_POST(s):
        content_length = int(s.headers['Content-Length'])
        post_data = s.rfile.read(content_length)
        proxy_request(post_data, s)

if __name__ == "__main__":
    httpd = http.server.HTTPServer(("", listen_port), MyHandler)
    try:
        print(("WebUI is listening at http://127.0.0.1:" + str(listen_port)))
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass

    httpd.server_close()
