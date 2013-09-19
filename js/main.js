$(document).delegate('#nfc', 'pageinit', function () {
    var logDiv = $(this).find('#nfc-log');
    logDiv.empty();
    var nfcLog = function (string) {
        logDiv.append($('<p class="nfc-log"><em>' + string + '</em></p>'));
    };
    var nfcLogError = function (e) {
        console.error(e);
        logDiv.append($('<p class="nfc-error"><strong>Error - ' +
            e.name + ": " + e.message + '</strong></p>'));
    };
    // try to get the default NFC adapter
    if (typeof tizen === 'undefined') {
        nfcLogError(new Error('No tizen API available'));
        return;
    }
    var adapter;
    var error = false;
    try {
        adapter = tizen.nfc.getDefaultAdapter();
    } catch (e) {
        error = true;
        console.error(e);
    }
    if (!adapter || error) {
        nfcLogError(new Error('Could not get nfc adapter'));
        return;
    }
    nfcLog('NFC adapter ready');
    var onPowerOn = function () { // Called when NFC adapter is powered on
        try {
            console.log("Power on succeed");
        } catch (err) {
            console.log(err.name + ": " + err.message);
        }
    };
    try {
        adapter = tizen.nfc.getDefaultAdapter();
        if (!adapter.powered) {
            adapter.setPowered(
                true, // Enable NFC adapter
                onPowerOn, // Handle succes

                function () {
                    console.log("Power on failed")
                }); // Handle failure
        } else {
            onPowerOn();
        }
    } catch (err) {
        console.log(err.name + ": " + err.message);
    }
    var readCB = {
        onsuccess: function(ndefMessage) {
            var numRecords = ndefMessage.recordCount;
            nfcLog("No. of records read = " + numRecords );
            nfcLog("Dump = " + ndefMessage.toByte());
            nfcLog("RECORDS -> " );
            for (var i = 0; i < numRecords; i++) {
                var record = ndefMessage.records[i];
                nfcLog(record + "\n" );
            }
        }
    }
    function onError (error) {
        nfcLogError(error);
    }
    function onSuccess () {
        nfcLog("Sucess for Write CB !!");
    }
    // Registers a callback function to invoke when an NFC tag is detected.
    var onTagDetectedCB = {
        onattach : function(nfcTag) {
        nfcLog("NFC Tag's type is " + nfcTag.type);
        // now that Tag is detected, call read
        try {
            if (!nfcTag.isSupportedNDEF) {
                nfcLog('Tag does not support NDEF');
                return;
            }
            nfcLog('Tag supports NDEF; reading messages...');
        
            nfcTag.readNDEF(readCB, onError);    
        } catch (err) {
            console.log(err);
        }

        // also if clicked write
        $("#writeButton").bind("click", function (event) {
            console.log("Write button clicked");
            var message = $("#name").val();
            console.log("message = " + message);
            var len = message.length;
            var newMessage = new tizen.NDEFMessage();
            newMessage.records[0] = new tizen.NDEFRecordText(message, 'en-US', 'UTF8');
            nfcTag.writeNDEF(newMessage, onSuccess, onError);  
        });
        
    },  
        ondetach : function() {
        console.log("NFC Tag is detached");
    }};
    adapter.setTagListener(onTagDetectedCB);
    
});
