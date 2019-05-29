//@include "json2.js"
var filepath = "/Users/jjzcru/Desktop/tes.png";
var apiKey = "333333";

// uploadZip(filepath, apiKey);
addSelect();
function addSelect() {
    
    var settingsDialog = new Window('dialog', 'Settings');
    settingsDialog.orientation = 'column';
    settingsDialog.alignment = 'right';
    settingsDialog.preferredSize = [130,100];

    //Add Api Key
    settingsDialog.apiKeyGroup = settingsDialog.add('group');
    settingsDialog.apiKeyGroup.orientation = 'row';
    settingsDialog.apiKeyGroup.add('statictext', [0, 0, 100, 20], "Api Key");
    var savedApiKey = '333333';
    settingsDialog.apiKeyGroup.apiKey = settingsDialog.apiKeyGroup.add('edittext', [0, 0, 120, 20], savedApiKey)
    
    //Add Publication list
    settingsDialog.publicationDropDownGroup = settingsDialog.add('group');
    settingsDialog.publicationDropDownGroup.orientation = 'row';
    settingsDialog.publicationDropDownGroup.add('statictext', [0, 0, 100, 20], "Publications");
    var publications = ["Apple", "Test", "New publication"];
    settingsDialog.publicationDropDownGroup.dropDown = settingsDialog.publicationDropDownGroup.add('dropdownlist', [0, 0, 120, 20], undefined, {items:publications})
    settingsDialog.publicationDropDownGroup.dropDown.selection = 1;

    // Panel buttons
    settingsDialog.buttonsBarGroup = settingsDialog.add('group');
    settingsDialog.buttonsBarGroup.orientation = 'row';
    settingsDialog.buttonsBarGroup.cancelBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'Cancel');
    settingsDialog.buttonsBarGroup.saveBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'OK');
    

    settingsDialog.buttonsBarGroup.saveBtn.onClick = function() {
        var selectedPublication = settingsDialog.publicationDropDownGroup.dropDown.selection;
        var apiKey = settingsDialog.apiKeyGroup.apiKey.text;
        alert(selectedPublication + ' ' + apiKey);
        this.parent.close();
    }

    settingsDialog.buttonsBarGroup.cancelBtn.onClick = function() {
        this.parent.close();
    }
    settingsDialog.show();
}
function uploadZip(filepath, apiKey) {
    var conn = new Socket;

    var reply = "";
    var host = "127.0.0.1:3000"

    var f = File ( filepath);
    var filename = f.name
    f.encoding = 'BINARY';
    f.open("r");
    var fContent = f.read();
    f.close();


    if(conn.open(host, "BINARY")) {
        conn.timeout=20000;

        var boundary = Math.random().toString().substr(2);

        var fileContent = "--" + boundary + "\r\n"
        + "Content-Disposition: form-data; name=\"contentFile\"; filename=\"" + filename +"\"\r\n"
        + "Content-Type: application/octet-stream\r\n"
        + "\r\n"
        + fContent
        + "\r\n";

        var apiKeyContent = "--" + boundary + "\r\n"
        + "Content-Disposition: form-data; name=\"secretKey\"\r\n"
        + "\r\n"
        + apiKey + "\r\n"
        + "\r\n";

        var contentType = "--" + boundary + "\r\n"
        + "Content-Disposition: form-data; name=\"contentType\"\r\n"
        + "\r\n"
        + "indesign" + "\r\n"
        + "\r\n";

        var content = fileContent
        + apiKeyContent
        + contentType
        + "--" + boundary + "--\r\n\r";

        var cs = "POST /upload HTTP/1.1\r\n"
        + "Content-Length: " + content.length + "\r\n"
        + "Content-Type: multipart/form-data; boundary=" + boundary + "\r\n" 
        + "Host: "+ host + "\r\n"
        + "Authorization: " + apiKey + "\r\n"
        + "Accept: */*\r\n"
        + "\r\n"
        + content;

        writeContent(cs);

        conn.write( cs );

        reply = conn.read(999999);
        conn.close();
        if( reply.indexOf( "200 OK" ) > 0 ) {
            var data = reply.substring(reply.indexOf("{"), reply.length);
            
            var response = JSON.parse(data);
            alert(response.success);
            // alert('File uploaded successfully');
        } else {
            alert("Error uploading the content, please try again")
        }
    } else {
        alert("I couldn't connect")
    }
}

function writeContent(content) {
    var fileObj = new File("/Users/jjzcru/Desktop/log.txt");

    fileObj.encoding = "UTF-8";  
    fileObj.open("w");  
    fileObj.write(content);  
    fileObj.close();  
}