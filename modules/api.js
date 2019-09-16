//@include "http.js"
var CanvasflowApi = function (host) {
    this.host = host;

    CanvasflowApi.prototype.getHealth = function() {
        var reply = new HTTPFile(this.host + "/health?qid=" + Date.now());
        // var reply = new HTTPFile(this.host + "?endpoint=/publications&secretkey=" + apiKey);
        reply.getResponse()
        return reply.getResponse();
    };

    CanvasflowApi.prototype.getPublications = function(apiKey) {
        var reply = new HTTPFile(this.host + "/publications?secretkey=" + apiKey + "&qid=" + Date.now());
        reply.getResponse()
        return reply.getResponse();
    };

    CanvasflowApi.prototype.validate = function(apiKey) {
        var reply = new HTTPFile(this.host + "/info?secretkey=" + apiKey + "&qid=" + Date.now());
        reply.getResponse()
        return reply.getResponse();
    };

    CanvasflowApi.prototype.getIssues = function(apiKey, PublicationID) {
        var reply = new HTTPFile(this.host + "/issues?secretkey=" + apiKey + "&publicationId=" + PublicationID + "&qid=" + Date.now());
        reply.getResponse()
        return reply.getResponse();
    };

    CanvasflowApi.prototype.getStyles = function(apiKey, PublicationID) {
        var reply = new HTTPFile(this.host + "/styles?secretkey=" + apiKey + "&publicationId=" + PublicationID + "&qid=" + Date.now());
        reply.getResponse()
        return reply.getResponse();
    };
}