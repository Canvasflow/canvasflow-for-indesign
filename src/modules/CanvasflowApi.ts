//@include "http.js"
class CanvasflowApi {
    host: string;

    constructor(host) {
        this.host = host;
    }

    http(method, ignoreParse?){
        // @ts-ignore
        var reply = new HTTPFile(this.host + method + "&qid=" + Date.now());
        if(!!ignoreParse) {
            // @ts-ignore
            return reply.getResponse();
        }
        
        // @ts-ignore
        return JSON.parse(reply.getResponse());
    }

    getHealth() {
        return this.http('/health?cf=1', true);
    }

    getPublications(apiKey) {
        return this.http('/publications?secretkey=' + apiKey);
    };

    validate(apiKey) {
        return this.http('/info?secretkey=' + apiKey);
    };

    getIssues(apiKey, PublicationID) {
        return this.http('/issues?secretkey=' + apiKey + '&publicationId=' + PublicationID);
    };

    getStyles(apiKey, PublicationID) {
        return this.http('/styles?secretkey=' + apiKey + '&publicationId=' + PublicationID);
    };

    getTemplates(apiKey, PublicationID) {
        return this.http('/templates?secretkey=' + apiKey + '&publicationId=' + PublicationID);
    };
}