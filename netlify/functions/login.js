exports.handler = async function(event, context) {
    try {
        // Parse the incoming login data (e.g., username/password or email)
        const requestBody = event.body ? JSON.parse(event.body) : {};
        const { username, password } = requestBody;

        // --- HARDCODED OR CUSTOM CHECK ---
        // You can define a simple username/password check right here, 
        // or customize this logic to fit your membership needs!
        if (username === "admin" && password === "password123") {
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    success: true, 
                    message: "Login successful!" 
                })
            };
        } else {
            return {
                statusCode: 401,
                body: JSON.stringify({ 
                    success: false, 
                    error: "Invalid username or password" 
                })
            };
        }

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
