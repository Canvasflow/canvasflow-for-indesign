//@include "http.js"
var CanvasflowApi = function (host) {
    this.host = host;

    CanvasflowApi.prototype.http = function(method, ignoreParse){
        var reply = new HTTPFile(this.host + method + "&qid=" + Date.now());
        if(!!ignoreParse) {
            return reply.getResponse();
        }

        return JSON.parse(reply.getResponse());
    }

    CanvasflowApi.prototype.getHealth = function() {
        return this.http('/health?cf=1', true);
    };

    CanvasflowApi.prototype.getPublications = function(apiKey) {
        return this.http('/publications?secretkey=' + apiKey);
    };

    CanvasflowApi.prototype.validate = function(apiKey) {
        return this.http('/info?secretkey=' + apiKey);
    };

    CanvasflowApi.prototype.getIssues = function(apiKey, PublicationID) {
        return this.http('/issues?secretkey=' + apiKey + '&publicationId=' + PublicationID);
    };

    CanvasflowApi.prototype.getStyles = function(apiKey, PublicationID) {
        return this.http('/styles?secretkey=' + apiKey + '&publicationId=' + PublicationID);
    };

    CanvasflowApi.prototype.getTemplates = function(apiKey, PublicationID) {
        return this.http('/templates?secretkey=' + apiKey + '&publicationId=' + PublicationID);
    };
}