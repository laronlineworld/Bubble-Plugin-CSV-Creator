function(properties, context) {

    const Papa = require('papaparse');

    const { delimiter: rawDelimiter, source_JSON: sourceJSON, scan_for_csv_injection, quotes } = properties;

    const delimiter = rawDelimiter === 'tab' ? '\t' : rawDelimiter;

    try {
        // Clean the input JSON by removing leading [ or trailing ]
        let cleanedSourceJSON = sourceJSON.trim();
        if (cleanedSourceJSON.startsWith("[")) {
            cleanedSourceJSON = cleanedSourceJSON.substring(1);
        }
        if (cleanedSourceJSON.endsWith("]")) {
            cleanedSourceJSON = cleanedSourceJSON.slice(0, -1);
        }

        // Parse the cleaned JSON input
        const parsedContent = JSON.parse(`[${cleanedSourceJSON.replace(/(\r\n|\n|\r)/gm, "")}]`);

        // Clean possible CSV Injections if required
        const cleanedContent = scan_for_csv_injection ? injectionCleaner(parsedContent) : parsedContent;

        // Use PapaParse to unparse the JSON to CSV
        const csv = "\uFEFF" + Papa.unparse(cleanedContent, {
            delimiter: delimiter,
            quotes: quotes
        });

        // Convert CSV string to Buffer and encode in base64
        const csvFile = Buffer.from(csv, 'utf8');
        const base64Text = csvFile.toString('base64');

        return {
            base64_text: base64Text,
            returned_an_error: false
        };
    } catch (err) {
        return {
            error_message: err.message,
            returned_an_error: true
        };
    }

    function injectionCleaner(array) {

        const badTokens = ["=", "+", "-", "@", "0x09", "0x0D"];
        const regexPattern = /(?<=^|;|,)./g;

        let newArray = array.map((newValue) => {
            Object.entries(newValue).forEach(([key, value]) => {
                // Check if the first character or any character placed
                // after a comma or semicolon is an injection token
                if (!Array.isArray(value) && value.match(regexPattern) !== null) {
                    value = value.replace(regexPattern, (x) => badTokens.includes(x) ? `\'${x}` : x )           
                } else if (Array.isArray(value) && value.length > 0){
                    value = value.map(y => y.replace(regexPattern, (x) => badTokens.includes(x) ? `\'${x}` : x ))
                }
                return (newValue[key] = value);
            }); 
            return newValue;
        });

        return newArray;

    }

}