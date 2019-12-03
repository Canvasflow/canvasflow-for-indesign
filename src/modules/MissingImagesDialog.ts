class MissingImagesDialog {
	private images: Array<string>;
	private dialogWidth: number;

	constructor(images: Array<string>) {
		this.images = images;
		this.dialogWidth = 400;
	}

	getResponse(): boolean{
		// @ts-ignore
		let window = new Window('dialog', 'Missing Images');
		window.orientation = 'column';
		window.alignment = 'right';
		window.preferredSize = [this.dialogWidth, 100];
		return !!this.renderWindow(window);
	};
	
	renderWindow(window: any): boolean {
		const warning = 'Warning';
		window.warningGroup = window.add('statictext', [0, 0, this.dialogWidth, 20], warning, {multiline: false});
		// @ts-ignore
		window.warningGroup.graphics.font = 'Arial-Bold:24';
		window.warningGroup.orientation = 'row:top';
		window.warningGroup.alignment = 'left';
		
		const intro = 'The document has linked images which are missing: ';
		window.introGroup = window.add('statictext', [0, 0, this.dialogWidth, 20], intro, {multiline: true});
		window.introGroup.orientation = 'row:top';
		window.introGroup.alignment = 'left';

		window.boxGroup = window.add('group');
		window.boxGroup.orientation = 'row';
		window.boxGroup.box = window.boxGroup.add(
			'edittext',
			[0, 0, this.dialogWidth, 200],
			this.images.join('\n'),
			{ multiline: true, readonly: true }
		);
		
		let question = 'Would you still like to publish?';
		window.questionGroup = window.add('statictext', [0, 0, this.dialogWidth, 25], question, {multiline: true});
		window.questionGroup.orientation = 'row:top';
		window.questionGroup.alignment = 'left';

		// Panel buttons
		window.buttonsBarGroup = window.add('group', undefined, 'buttons');
		window.buttonsBarGroup.orientation = 'row';
		window.buttonsBarGroup.alignChildren = 'bottom';
		window.buttonsBarGroup.closeBtn = window.buttonsBarGroup.add(
			'button',
			undefined,
			'Close'
		);

		window.buttonsBarGroup.closeBtn.onClick = function() {
			window.close(false);
		};
		
		window.buttonsBarGroup.nextBtn = window.buttonsBarGroup.add(
			'button',
			undefined,
			'Continue'
		);
		window.buttonsBarGroup.nextBtn.onClick = function(){
			window.close(true);
		};

		return window.show();
	}
}