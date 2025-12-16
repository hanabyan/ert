import React from 'react';
import { Button } from 'antd';
import { WhatsAppOutlined } from '@ant-design/icons';

/**
 * WhatsApp Button Component
 * Opens WhatsApp chat with predefined message
 * 
 * @param {string} phoneNumber - Phone number in international format (e.g., "6281234567890")
 * @param {string} message - Predefined message text
 * @param {string} buttonText - Button label (optional)
 * @param {string} type - Button type (optional, default: "default")
 * @param {string} size - Button size (optional, default: "middle")
 * @param {boolean} block - Full width button (optional, default: false)
 * @param {object} style - Custom styles (optional)
 */
export default function WhatsAppButton({ 
    phoneNumber, 
    message = '', 
    buttonText = 'Hubungi via WhatsApp',
    type = 'default',
    size = 'middle',
    block = false,
    style = {}
}) {
    const handleClick = () => {
        // Remove any non-digit characters from phone number
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        
        // Encode message for URL
        const encodedMessage = encodeURIComponent(message);
        
        // WhatsApp API URL
        const whatsappURL = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
        
        // Open in new tab
        window.open(whatsappURL, '_blank', 'noopener,noreferrer');
    };

    return (
        <Button
            type={type}
            size={size}
            block={block}
            icon={<WhatsAppOutlined />}
            onClick={handleClick}
            style={{
                backgroundColor: type === 'primary' ? '#25D366' : undefined,
                borderColor: type === 'primary' ? '#25D366' : '#25D366',
                color: type === 'primary' ? 'white' : '#25D366',
                ...style
            }}
        >
            {buttonText}
        </Button>
    );
}
