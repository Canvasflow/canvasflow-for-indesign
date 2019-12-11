class CanvasflowApi {
	private host: string;

	constructor(host: string) {
		this.host = host;
	}

	http(uri: string, ignoreParse: boolean = false) {
		// @ts-ignore
		const reply: any = new HTTPFile(`${this.host}${uri}&qid=${Date.now()}`);
		if (!!ignoreParse) {
			return reply.getResponse();
		}

		// @ts-ignore
		return JSON.parse(reply.getResponse());
	}

	getHealth = () => this.http('/health?cf=1', true);

	getVersion = () => this.http('/plugins/indesign/version?cf=1');

	getPublications = (apiKey: string) => this.http(`/publications?secretkey=${apiKey}`);

	validate = (apiKey: string) => this.http(`/info?secretkey=${apiKey}`);

	getIssues = (apiKey: string, PublicationID: any) =>  this.http(`/issues?secretkey=${apiKey}&publicationId=${PublicationID}`);

	getStyles = (apiKey: string, PublicationID: any) => this.http(`/styles?secretkey=${apiKey}&publicationId=${PublicationID}`);

	getTemplates = (apiKey: string, PublicationID: any) => this.http(`/templates?secretkey=${apiKey}&publicationId=${PublicationID}`);
}
