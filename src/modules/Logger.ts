class Logger {
	private logFilePath: string;
	private file: File;
	private applicationVersion: string;
	private engineVersion: string;

	private startTime: any;
	private endTime: any;

	public os: string;
	public version: string;

	constructor(logFilePath: string, os: string, version: string) {
		this.logFilePath = logFilePath;
		this.file = new File(logFilePath);
		this.os = os;
		this.applicationVersion = app.version;
		this.engineVersion = $.version;

		this.version = version;
		if (!this.file.exists) {
			this.file.encoding = 'UTF-8';
			this.file.open('w');
			this.file.writeln('---------- Canvasflow logs file ----------');
			this.file.close();
		}
	}

	private pad(num: any) {
		const s = '000000000' + num;
		return s.substr(s.length - 2);
	}

	public start(action: string, document?: Document) {
		this.file = new File(this.logFilePath);
		this.file.open('a');
		this.file.writeln('\n---------- START ----------');
		const now = new Date();
		const currentDate =
			now.getFullYear() +
			'-' +
			this.pad(now.getMonth() + 1) +
			'-' +
			this.pad(now.getDate());
		this.startTime = now;
		if (!!document) {
			this.file.writeln(`Name: "${app.activeDocument.name}"`);
			this.file.writeln(`Path: "${document.filePath.fsName}"`);
		}
		this.file.writeln(`Date: "${currentDate}"`);
		this.file.writeln(`Action: "${action}"`);
		this.file.writeln(`OS: "${this.os}"`);
		this.file.writeln(`InDesign Version: "${this.applicationVersion}"`);
		this.file.writeln(`Engine Version: "${this.engineVersion}"`);
		this.file.writeln(`Plugin Version: "${this.version}"`);
		
		this.file.writeln(`Start time: "${this.pad(now.getHours())}:${this.pad(now.getMinutes())}:${this.pad(now.getSeconds())}"`);
		this.file.writeln('---------------------------');
	}

	end(e?: any) {
		if (!!e) {
			this.file.writeln('--------- ERROR ---------');
			this.file.writeln(`Message: "${e.message}"`);
			this.file.writeln(`Line: ${e.line}`);
			this.file.writeln(`\nStack:\n${e.getStack()}`);
			this.file.writeln(`\nJSON:\n${e.toJson()}`);
		}
		let now = new Date();
		this.endTime = now;
		this.file.writeln('---------------------------');
		this.file.writeln(
			`End time: "${this.pad(now.getHours())}:${this.pad(
				now.getMinutes()
			)}:${this.pad(now.getSeconds())}"`
		);
		this.file.writeln(
			`Total time: ${Math.abs((this.endTime - this.startTime) / 1000)} seconds`
		);
		this.file.writeln('---------- END ----------');
		this.file.close();
	}

	log(content: string, type: string = '', separator: string = ' | ') {
		let prefix = '';

		let now = new Date();
		let date = `${now.getFullYear()}-${this.pad(now.getMonth() + 1)}-${this.pad(now.getDate())}`;
		let time = `${this.pad(now.getHours())}:${this.pad(now.getMinutes())}:${this.pad(now.getSeconds())}`;
		let timestamp = `${date} ${time}`;

		switch (type) {
			case 'timestamp':
				prefix = timestamp + separator;
				break;
			case 'time':
				prefix = time + separator;
				break;
			case 'date':
				prefix = date + separator;
				break;
			default:
				prefix = '';
		}
		this.file.writeln(prefix + content);
	}

	logError(e: any) {
		this.file.writeln('--------- ERROR ---------');
		this.file.writeln(`Message: "${e.message}"`);
		this.file.writeln(`Line: ${e.line}`);
		this.file.writeln(`\nStack:\n${e.getStack()}`);
		this.file.writeln(`\nJSON:\n${e.toJson()}`);
	}
}
