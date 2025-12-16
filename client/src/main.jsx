import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, App as AntdApp } from 'antd'
import idID from 'antd/locale/id_ID'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import './index.css'
import './responsive.css'
import App from './App.jsx'

dayjs.locale('id')

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ConfigProvider
            locale={idID}
            theme={{
                token: {
                    colorPrimary: '#1890ff',
                    borderRadius: 8,
                },
            }}
        >
            <AntdApp message={{ maxCount: 3 }} notification={{ maxCount: 3 }}>
                <App />
            </AntdApp>
        </ConfigProvider>
    </StrictMode>,
)
