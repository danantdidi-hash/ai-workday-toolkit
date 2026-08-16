exports.handler = async function(event, context) {
    try {
        const requestBody = event.body ? JSON.parse(event.body) : {};
        const { email } = requestBody;

        // Simple check to ensure an email was entered
        if (!email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: "Email is required" })
            };
        }

        // Allow access for the email entered
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: "Access granted!",
                redirectUrl: "/tools" // Change this to wherever your tools page is located
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
