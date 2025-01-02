function(instance, properties, context) {
    
    // Define constants and variables
    const delimiter = properties.delimiter === 'tab' ? '\t' : properties.delimiter;
    let sourceJSON = properties.source_JSON.trim();

    // Check and remove leading [ or ending ] if they exist
    if (sourceJSON.startsWith('[')) {
        sourceJSON = sourceJSON.slice(1);
    }
    if (sourceJSON.endsWith(']')) {
        sourceJSON = sourceJSON.slice(0, -1);
    }

    const content = JSON.parse(`[${sourceJSON.replace(/(\r\n|\n|\r)/gm, "")}]`);
    const filename = `${properties.file_name}.csv`;
    const mimetype = 'text/csv';

    // Generate CSV data using Papa.unparse
    const csvData = "\uFEFF" + Papa.unparse(content, {
        delimiter: delimiter,
        encoding: 'UTF-8'
    });

    // Create a Blob from the CSV data
    const blob = new Blob([csvData], { type: mimetype });

    // Create and upload the file
    createFile(blob, filename).then((url) => {
        if (properties.save_file) {
            openSaveFileDialog(blob, filename);
        }
        publishUrl(url);
    }).catch((err) => {
        console.error('Error:', err);
    });

    // Function to open save file dialog
    function openSaveFileDialog(blob, filename) {
        if (!blob) return;

        // Download file
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, filename);
            return;
        }

        const lnk = document.createElement('a');
        const url = window.URL;
        const objectURL = url.createObjectURL(blob);

        lnk.download = filename || 'untitled';
        lnk.href = objectURL;
        lnk.dispatchEvent(new MouseEvent('click'));
        setTimeout(() => url.revokeObjectURL(objectURL), 0);
    }

    // Function to create file and return a URL
    async function createFile(blob, filename) {
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onloadend = () => {
                const base64String = reader.result;
                const base64Substring = base64String.substr(base64String.indexOf(',') + 1);

                // Upload to the CSV Creator element
                context.uploadContent(filename, base64Substring, (err, url) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(url);
                    }
                });
            };

            reader.onerror = () => {
                reject(new Error('Failed to read the blob.'));
            };

            reader.readAsDataURL(blob);
        });
    }

    // Function to publish URL to element
    function publishUrl(url) {
        instance.publishState('created_file', url);
        instance.triggerEvent('has_created_your_file');
    }


}