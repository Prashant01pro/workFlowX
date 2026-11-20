import express, { urlencoded } from 'express'
import cors from 'cors'
import { globalErrorHandler } from './middlewares/error.middleware.js'
import cookieParser from 'cookie-parser'
import authRouter from './features/auth/auth.route.js'
import userRouter from './features/users/user.route.js'
import projectsRouter from './features/projects/project.route.js'
import taskRouter from './features/tasks/task.route.js'
import noteRouter from './features/notes/note.route.js'
import transactionRouter from './features/transactions/transaction.route.js'
import dashboardRouter from './features/dashboard/dashboard.route.js'
import adminRouter from './features/admin/admin.route.js'
import notificationRouter from './features/notifications/notification.route.js'

const app = express()
app.set('trust proxy', 1); // Trust first reverse proxy (Render load balancer)

// Explicit origin allowlist supporting local development and environment-configured origins
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/+$/, '')).filter(Boolean) : [])
]

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server health checks)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        return callback(new Error('Blocked by CORS policy'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(urlencoded({ extended: true }))
app.use(cookieParser())

app.get('/health', (req, res) => {
    res.status(200).json({
        message: 'Server is running'
    })
})

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/projects', projectsRouter)
app.use('/api/v1/tasks', taskRouter)
app.use('/api/v1/notes', noteRouter)
app.use('/api/v1/transactions', transactionRouter)
app.use('/api/v1/dashboard', dashboardRouter)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/notifications', notificationRouter)

app.use(globalErrorHandler)

export default app;
