//@include "http.js"
var CanvasflowApi = function (host) {
    this.host = host;

    CanvasflowApi.prototype.getHealth = function() {
        var reply = new HTTPFile(this.host + "/health");
        // var reply = new HTTPFile(this.host + "?endpoint=/publications&secretkey=" + apiKey);
        return reply.getResponse();
    };

    CanvasflowApi.prototype.getPublications = function(apiKey) {
        var reply = new HTTPFile(this.host + "/publications?secretkey=" + apiKey);
        // var reply = new HTTPFile(this.host + "?endpoint=/publications&secretkey=" + apiKey);
        return reply.getResponse();
    };

    CanvasflowApi.prototype.validate = function(apiKey) {
        var reply = new HTTPFile(this.host + "/info?secretkey=" + apiKey);
        // var reply = new HTTPFile(this.host + "?endpoint=/info&secretkey=" + apiKey);
        return reply.getResponse();
    };

    CanvasflowApi.prototype.getIssues = function(apiKey, PublicationID) {
        var reply = new HTTPFile(this.host + "/issues?secretkey=" + apiKey + "&publicationId=" + PublicationID);
        // var reply = new HTTPFile(this.host + "?endpoint=/issues&secretkey=" + apiKey + "&publicationId=" + PublicationID);
        return reply.getResponse();
    };

    CanvasflowApi.prototype.getStyles = function(apiKey, PublicationID) {
        var reply = new HTTPFile(this.host + "/styles?secretkey=" + apiKey + "&publicationId=" + PublicationID);
        // var reply = new HTTPFile(this.host + "?endpoint=/styles&secretkey=" + apiKey + "&publicationId=" + PublicationID);
        return reply.getResponse();
    };
}