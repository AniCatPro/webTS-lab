import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.3',
        info: { title: 'File Manager API', version: '1.0.0' },
        servers: [{ url: 'http://localhost:4000/api' }],
        components: {
            securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: [] // добавь JSDoc-комменты к роутам, если хочешь генерить схемы автоматически
});

export { swaggerUi };
