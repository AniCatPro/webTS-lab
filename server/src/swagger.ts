// server/src/swagger.ts
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const PORT = Number(process.env.PORT || 4000);
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'File Manager API',
            version: '1.0.0',
            description:
                'REST API файлового менеджера. Авторизация для клиентских роутов — cookie (token), для админских — Bearer.',
        },
        // ВАЖНО: без "/api" тут — т.к. пути в роутерах уже начинаются с /api/...
        servers: [{ url: SERVER_URL }],
        components: {
            securitySchemes: {
                // JWT в cookie (клиентские маршруты)
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token',
                    description: 'JWT-токен, который выставляется методом /api/auth/login',
                },
                // Bearer для админских эндпоинтов
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Bearer JWT для /api/admin/*',
                },
            },
            schemas: {
                // Базовые сущности (можно расширять по проекту)
                UserPublic: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['ADMIN', 'USER'] },
                    },
                    required: ['id', 'email', 'role'],
                },
                FsEntry: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        kind: { type: 'string', enum: ['file', 'folder'] },
                        parentId: { type: ['string', 'null'], nullable: true },
                        mimeType: { type: ['string', 'null'], nullable: true },
                        type: { type: ['string', 'null'], nullable: true, description: 'image|video|audio|document|other' },
                        url: { type: ['string', 'null'], nullable: true },
                        size: { type: ['integer', 'null'], nullable: true },
                        createdAt: { type: ['string', 'null'], format: 'date-time', nullable: true },
                        updatedAt: { type: ['string', 'null'], format: 'date-time', nullable: true },
                    },
                    required: ['id', 'name', 'kind'],
                },
                PaginatedFsEntry: {
                    type: 'object',
                    properties: {
                        data: { type: 'array', items: { $ref: '#/components/schemas/FsEntry' } },
                        page: { type: 'integer', example: 1 },
                        pageSize: { type: 'integer', example: 20 },
                        total: { type: 'integer', example: 42 },
                    },
                },
                LoginDto: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 },
                    },
                    required: ['email', 'password'],
                },
                CreateFolderDto: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        parentId: { type: ['string', 'null'], nullable: true },
                    },
                    required: ['name'],
                },
                MoveDto: {
                    type: 'object',
                    properties: {
                        parentId: { type: ['string', 'null'], nullable: true },
                    },
                },
                TextContent: {
                    type: 'object',
                    properties: { content: { type: 'string' } },
                    required: ['content'],
                },
                ErrorResponse: {
                    type: 'object',
                    properties: { message: { type: 'string' } },
                },
            },
        },
        tags: [
            { name: 'Auth', description: 'Авторизация' },
            { name: 'Files', description: 'Файлы и папки' },
            { name: 'Admin', description: 'Админ-панель (Bearer)' },
        ],
        // По умолчанию НИЧЕГО не защищаем — безопасность укажем у конкретных роутов (cookieAuth или bearerAuth)
        security: [],
    },
    // Включаем автоскан JSDoc-комментариев в ts-роутерах:
    apis: [
        'src/routes/*.ts',
        'src/routes/**/*.ts',
    ],
});

export { swaggerUi };