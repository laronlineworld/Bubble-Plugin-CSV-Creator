function(properties, context) {
    
    const delimiter = properties.delimiter === 'tab' ? '\t' : properties.delimiter;
    const filename = `${properties.file_name}.csv`;
    const mimetype = 'text/csv';

    // Function to clean the JSON string
    function cleanJSON(jsonString) {
        if (jsonString.startsWith('[')) {
            jsonString = jsonString.slice(1);
        }
        if (jsonString.endsWith(']')) {
            jsonString = jsonString.slice(0, -1);
        }
        return jsonString;
    }

    // Clean the source JSON
    let cleanedJSON = cleanJSON(properties.source_JSON);

    // Parse the source JSON and handle potential errors
    let content;
    try {
        content = JSON.parse(`[${cleanedJSON.replace(/(\r\n|\n|\r)/gm, "")}]`);
    } catch (error) {
        console.error('Invalid JSON:', error);
        return;
    }

    // Use PapaParse to unparse the JS Array and prepend BOM
    let csvFile;
    try {
        csvFile = "\uFEFF" + Papa.unparse(content, {
            delimiter: delimiter,
            quotes: properties.quotes,
            encoding: 'UTF-8'
        });
    } catch (error) {
        console.error('Error during CSV generation:', error);
        return;
    }

    // Function to trigger the file download
    function openSaveFileDialog(data, filename, mimetype) {
        if (!data) return;

        try {
            const blob = data.constructor !== Blob ?
                  new Blob([data], {
                      type: mimetype || 'application/octet-stream'
                  }) :
            data;

            // Create a link and trigger the download
            const link = document.createElement('a');
            const objectURL = URL.createObjectURL(blob);

            link.href = objectURL;
            link.download = filename;
            link.dispatchEvent(new MouseEvent('click'));

            setTimeout(() => URL.revokeObjectURL(objectURL), 100);
        } catch (error) {
            console.error('Error during file creation or download:', error);
        }
    }

    // Trigger the save file dialog
    openSaveFileDialog(csvFile, filename, mimetype);
    	
}