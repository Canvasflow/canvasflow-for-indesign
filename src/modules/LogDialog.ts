class LogDialog {
	defaultDialogSize: Array<number> = [300, 100];
	maxLines = 100;
	logFilePath: string;

	constructor(logFilePath: string) {
		this.logFilePath = logFilePath;
	}

	getLogsContent() {
		let lines = [];
		let logFile = new File(this.logFilePath);
		if (!logFile.exists) {
			return 'There are no logs';
		}

		logFile.open('r');
		do {
			lines.push(logFile.readln());
		} while (!logFile.eof);
		logFile.close();

		return lines
			.reverse()
			.slice(undefined, this.maxLines)
			.join('\n');
	}

	renderWindow(window) {
		// Log box
		window.boxGroup = window.add('group');
		window.boxGroup.orientation = 'row';
		window.boxGroup.box = window.boxGroup.add(
			'edittext',
			[0, 0, 400, 400],
			this.getLogsContent(),
			{ multiline: true, readonly: true }
		);

		// Panel buttons
		window.buttonsBarGroup = window.add('group', undefined, 'buttons');
		window.buttonsBarGroup.orientation = 'row';
		window.buttonsBarGroup.alignChildren = 'bottom';
		window.buttonsBarGroup.closeBtn = window.buttonsBarGroup.add(
			'button',
			undefined,
			'Close'
		);

		window.buttonsBarGroup.closeBtn.onClick = () => {
			window.close();
		};
		let logFile = new File(this.logFilePath);
		if (logFile.exists) {
			window.buttonsBarGroup.openBtn = window.buttonsBarGroup.add(
				'button',
				undefined,
				'Open'
			);
			window.buttonsBarGroup.openBtn.onClick = () => {
				logFile.execute();
			};
		}
		window.show();
	}

	show = () => {
		// @ts-ignore
		let window = new Window('dialog', 'Logs');
		window.orientation = 'column';
		window.alignment = 'right';
		window.preferredSize = this.defaultDialogSize;
		this.renderWindow(window);
	};
}
