//@include "http.js"
var CanvasflowApi = function (host) {
    this.host = host;

    CanvasflowApi.prototype.getPublications = function(apiKey) {
        var reply = new HTTPFile(host + "/publications?secretkey=" + apiKey);
        return reply.getResponse();
    };

    CanvasflowApi.prototype.validate = function(apiKey) {
        var reply = new HTTPFile(host + "/info?secretkey=" + apiKey);
        return reply.getResponse();
    };

    CanvasflowApi.prototype.getIssues = function(apiKey, PublicationID) {
        var reply = new HTTPFile(host + "/issues?secretkey=" + apiKey + "&publicationId=" + PublicationID);
        return reply.getResponse();
    };

    CanvasflowApi.prototype.getStyles = function(apiKey, PublicationID) {
        var reply = new HTTPFile(host + "/styles?secretkey=" + apiKey + "&publicationId=" + PublicationID);
        return reply.getResponse();
    };
}