import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';


export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.3',
        info: { title: 'File Manager API', version: '1.0.0' },
        components: {
            securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [], // можно подключить JSDoc‑комменты из routes/*.ts
});


export { swaggerUi };