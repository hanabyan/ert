import React from 'react';
import { Dropdown, Button } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

/**
 * Reusable action dropdown for table rows
 * @param {Array} items - Array of menu items { key, label, icon, onClick, danger, disabled }
 * @param {string} trigger - Trigger type (default: 'click')
 */
export default function TableActionDropdown({ items, trigger = 'click' }) {
    const menuItems = items.map(item => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        danger: item.danger,
        disabled: item.disabled,
        onClick: item.onClick,
    }));

    return (
        <Dropdown
            menu={{ items: menuItems }}
            trigger={[trigger]}
            placement="bottomRight"
        >
            <Button 
                type="text" 
                icon={<EllipsisOutlined />}
                style={{ fontSize: '20px' }}
            />
        </Dropdown>
    );
}
