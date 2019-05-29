var HTTPFile = function (url,port) {
    if (arguments.length == 1) {
        url = arguments[0];
        port = 80;
    };

    this.url = url;
    this.port = port;
    this.httpPrefix = this.url.match(/http:\/\//);
    this.domain = this.httpPrefix == null ? this.url.split("/")[0]+":"+this.port :this.url.split("/")[2]+":"+this.port;
    this.call = "GET "+ (this.httpPrefix == null ? "http://"+this.url : this.url)+" HTTP/1.0\r\nHost:" +(this.httpPrefix == null ? this.url.split("/")[0] :this.url.split("/")[2])+"\r\nConnection: close\r\n\r\n";
    this.reply = new String();
    this.conn = new Socket();
    this.conn.encoding = "binary";

    HTTPFile.prototype.getResponse = function(f) {
        var typeMatch = this.url.match(/(\.)(\w{3,4}\b)/g);
        if (this.conn.open(this.domain,"binary")) {
            this.conn.write(this.call);
            this.reply = this.conn.read(9999999999);
            this.conn.close();
        } else {
            this.reply = "";
        }
        return this.reply.substr(this.reply.indexOf("\r\n\r\n")+4);;
    };
}