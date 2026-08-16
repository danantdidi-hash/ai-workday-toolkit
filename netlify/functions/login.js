exports.handler = async function(event, context) {
    const backendUrl = process.env.SECRET_TOOL_URL;

    try {
        const requestBody = event.body ? JSON.parse(event.body) : {};

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to authenticate with backend' })
        };
    }
};
