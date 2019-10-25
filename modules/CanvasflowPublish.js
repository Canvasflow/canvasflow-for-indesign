//@include "json2.js"
//@include "api.js"
//@include "CanvasflowBuild.jsx"

var CanvasflowPublish = function(canvasflowSettings, host, cfBuild, canvasflowApi) {
    var $ = this;
    $.baseDirectory = '';
    $.filePath = '';
    $.uuid = '';
    $.host = host;
    $.canvasflowApi = null;
    $.dialog = {};
    $.pagesRange = null;
    $.cfBuild = cfBuild;

    $.savedSettings = canvasflowSettings.getSavedSettings();

    $.createFormParam = function(boundary, property, value){
        return '--' + boundary + '\r\n'
            + 'Content-Disposition: form-data; name="' + property +'"\r\n'
            + '\r\n'
            + value + '\r\n'
            + '\r\n';
    }

    $.uploadZip = function(filepath) {
        var conn = new Socket;
    
        var reply = '';
        var host = $.host + ':80'
    
        var f = File ( filepath);
        var filename = f.name
        f.encoding = 'BINARY';
        f.open("r");
        var fContent = f.read();
        f.close();

        var articleName = f.displayName.replace('.zip', '');
    
        apiKey = $.savedSettings.apiKey;
        var PublicationID = $.savedSettings.PublicationID;
        var IssueID = $.savedSettings.IssueID;
        var StyleID = $.savedSettings.StyleID;
        var creationMode = $.savedSettings.creationMode || 'document';
        var contentOrder = $.savedSettings.contentOrder || 'natural';
    
        if(conn.open(host, 'BINARY')) {
            conn.timeout=20000;
    
            var boundary = Math.random().toString().substr(2);

            $.uuid = $.cfBuild.uuid || '';
    
            var fileContent = '--' + boundary + '\r\n'
            + 'Content-Disposition: form-data; name="contentFile"; filename="' + filename +'"\r\n'
            + 'Content-Type: application/octet-stream\r\n'
            + '\r\n'
            + fContent
            + '\r\n';
    
            var apiKeyContent = $.createFormParam(boundary, 'secretKey', apiKey);
            var creationModeContent = $.createFormParam(boundary, 'creationMode', creationMode);
            var contentOrderContent = $.createFormParam(boundary, 'contentOrder', contentOrder);
            var articleNameContent = $.createFormParam(boundary, 'articleName', articleName);
            var PublicationIDContent = $.createFormParam(boundary, 'publicationId', PublicationID);
            var IssueIDContent = $.createFormParam(boundary, 'issueId', IssueID);
            var StyleIDContent = $.createFormParam(boundary, 'styleId', StyleID);
            var contentType = $.createFormParam(boundary, 'contentType', 'indesign');
            var articleIdContent = $.createFormParam(boundary, 'articleId', $.uuid);
    
            var content = fileContent
            + apiKeyContent
            + creationModeContent
            + contentOrderContent
            + articleNameContent
            + contentType
            + PublicationIDContent
            + IssueIDContent
            + StyleIDContent
            + articleIdContent
            + '--' + boundary + '--\r\n\r';
    
            var cs = 'POST /v1/index.cfm?endpoint=/article HTTP/1.1\r\n'
            + 'Content-Length: ' + content.length + '\r\n'
            + 'Content-Type: multipart/form-data; boundary=' + boundary + '\r\n'
            + 'Host: '+ host + '\r\n'
            + 'Authorization: ' + apiKey + '\r\n'
            + 'Accept: */*\r\n'
            + '\r\n'
            + content;
    
            conn.write( cs );
    
            reply = conn.read();
            conn.close();
    
            if (reply.indexOf('200') > 0) {
                // var data = reply.substring(reply.indexOf("{"), reply.length);
                // alert(reply);
                // var response = JSON.parse(data);
                return true;
            } else {
                alert(reply);
                return false;
            }
        } else {
            alert('I couldn\'t connect to the server');
            return false;
        }
    }

    $.getPublication = function() {
        var apiKey = $.savedSettings.apiKey;
        var PublicationID = $.savedSettings.PublicationID;

        var publications = $.canvasflowApi.getPublications(apiKey);
        for(var i=0; i < publications.length; i++) {
            var publication = publications[i];
            if(publication.id == PublicationID) {
                return publication;
            }
        }
        return null;
    }

    $.getIssue = function() {
        var apiKey = $.savedSettings.apiKey;
        var PublicationID = $.savedSettings.PublicationID;
        var IssueID = $.savedSettings.IssueID;

        var issues = $.canvasflowApi.getIssues(apiKey, PublicationID);
        for(var i=0; i < issues.length; i++) {
            var issue = issues[i];
            if(issue.id == IssueID) {
                return issue;
            }
        }
        return null;
    }

    $.getStyle = function() {
        var apiKey = $.savedSettings.apiKey;
        var PublicationID = $.savedSettings.PublicationID;
        var StyleID = $.savedSettings.StyleID;

        var styles = $.canvasflowApi.getStyles(apiKey, PublicationID);
        for(var i=0; i < styles.length; i++) {
            var style = styles[i];
            if(style.id == StyleID) {
                return style;
            }
        }
        return null;
    }

    $.displayConfirmDialog = function() {
        var dialog = new Window('dialog', 'Publish to Canvasflow', undefined, {closeButton: false});
        dialog.orientation = 'column';
        dialog.alignment = 'right';
        dialog.preferredSize = [300,100];

        var valuesWidth = 200;
        var labelWidth = 150;

        var endpoint = $.savedSettings.endpoint;

        $.canvasflowApi = new CanvasflowApi('http://' + endpoint + '/v2');

        // Intro
        var intro = 'You are about to publish the current document to Canvasflow. \n\nPlease confirm the following details are correct:';
        dialog.introGroup = dialog.add('statictext', [0, 0, valuesWidth * 1.5, 70], intro, {multiline: true});
        dialog.introGroup.orientation = 'row:top';
        dialog.introGroup.alignment = 'left';

        // External ID
        dialog.externalIDGroup = dialog.add('group');
        dialog.externalIDGroup.orientation = 'row';
        dialog.externalIDGroup.add('statictext', [0, 0, labelWidth, 20], 'ID');
        dialog.externalIDGroup.add('statictext', [0, 0, labelWidth, 20], $.cfBuild.uuid);

        // Publication
        var publication = $.getPublication();
        dialog.publicationGroup = dialog.add('group');
        dialog.publicationGroup.orientation = 'row';
        dialog.publicationGroup.add('statictext', [0, 0, labelWidth, 20], 'Publication');
        dialog.publicationGroup.add('statictext', [0, 0, labelWidth, 20], publication.name);

        // Issue
        if(publication.type === 'issue') {
            var issue = $.getIssue();
            dialog.issueGroup = dialog.add('group');
            dialog.issueGroup.orientation = 'row';
            dialog.issueGroup.add('statictext', [0, 0, labelWidth, 20], 'Issue');
            dialog.issueGroup.add('statictext', [0, 0, labelWidth, 20], issue.name);
        }
        
        // Style
        var style = $.getStyle();
        dialog.styleGroup = dialog.add('group');
        dialog.styleGroup.orientation = 'row';
        dialog.styleGroup.add('statictext', [0, 0, labelWidth, 20], 'Style');
        dialog.styleGroup.add('statictext', [0, 0, labelWidth, 20], style.name);

        // Creation Mode
        dialog.creationModeGroup = dialog.add('group');
        dialog.creationModeGroup.orientation = 'row';
        dialog.creationModeGroup.add('statictext', [0, 0, labelWidth, 20], 'Article Creation');
        var creationMode = $.savedSettings.creationMode[0].toUpperCase() +  $.savedSettings.creationMode.slice(1); 
        dialog.creationModeGroup.add('statictext', [0, 0, labelWidth, 20], creationMode);

        dialog.buttonsBarGroup = dialog.add('group');
        dialog.buttonsBarGroup.orientation = 'row';
        dialog.buttonsBarGroup.alignChildren = 'bottom';    
        dialog.buttonsBarGroup.cancelBtn = dialog.buttonsBarGroup.add('button', undefined, 'Cancel');
        dialog.buttonsBarGroup.saveBtn = dialog.buttonsBarGroup.add('button', undefined, 'OK');

        dialog.buttonsBarGroup.saveBtn.onClick = function() {
            dialog.close(1);
        }

        dialog.buttonsBarGroup.cancelBtn.onClick = function() {
            dialog.close(0);
        }
    
        return dialog.show();
    }

    $.publish = function() {
        if(canvasflowApi.getHealth() === null) {
            throw new Error('Canvasflow Service not currently available');
        }

        if (app.documents.length != 0){
            var zipFilePath = '';
            var response = $.displayConfirmDialog();
            if(!!response) {
                var baseDirectory = app.activeDocument.filePath + '/';
                $.filePath = baseDirectory + app.activeDocument.name;
                var ext = app.activeDocument.name.split('.').pop();
                $.baseDirectory = baseDirectory + app.activeDocument.name.replace('.' + ext, '');
                zipFilePath = cfBuild.build();
                if(!cfBuild.isBuildSuccess) {
                    alert('Build cancelled');
                    return;
                }
                var publishStartTime = (new Date()).getTime();
                if($.uploadZip(zipFilePath)) {
                    new File(zipFilePath).remove()
                    alert('Success \nThe file has been published to Canvasflow');
                    logger.log((new Date()).getTime() - publishStartTime, 'Publishing')
                } else {
                    logger.log((new Date()).getTime() - publishStartTime, 'Publishing with error')
                    throw new Error('Error uploading the content, please try again');
                }
            }
        }
        else{
            alert ('Please select an article to Publish');
        }
    }
}