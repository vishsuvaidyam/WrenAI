import { Layout, Button, Drawer } from 'antd';
import styled, { css } from 'styled-components';
import SimpleLayout from '@/components/layouts/SimpleLayout';
import Sidebar from '@/components/sidebar';
import Settings from '@/components/settings';
import useModalAction from '@/hooks/useModalAction';
import { useState, useEffect } from 'react';

const { Sider } = Layout;

const basicStyle = css`
  height: calc(100vh - 48px);
  overflow: auto;
`;

const StyledContentLayout = styled(Layout)<{ color?: string }>`
  position: relative;
  ${basicStyle}
  ${(props) => props.color && `background-color: var(--${props.color});`}
`;

const StyledSider = styled(Sider)`
  ${basicStyle}
`;

type Props = React.ComponentProps<typeof SimpleLayout> & {
  sidebar?: React.ComponentProps<typeof Sidebar>;
  color?: string;
};

export default function SiderLayout(props: Props) {
  const { sidebar, loading, color } = props;
  const settings = useModalAction();
  const collapsed = true;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Update global CSS for .kPulPT positioning based on sidebar state
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .kPulPT {
        position: fixed;
        width: 680px;
        left: ${collapsed ? '50%' : '34%'};
        transform: translateX(-50%);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [collapsed]);

  return (
    <SimpleLayout loading={loading}>
      <Layout className="adm-layout">
        <StyledSider
          width={280}
          collapsible
          collapsed={collapsed}
          collapsedWidth={0}
          trigger={null}
        >
          <Sidebar {...sidebar} onOpenSettings={settings.openModal} />
        </StyledSider>
        <StyledContentLayout color={color}>
          <Button
            type="text"
            onClick={() => setDrawerOpen(true)}
            style={{ position: 'absolute', top: 4, left: 4, zIndex: 10 }}
          >
            Open Sidebar
          </Button>
          {props.children}
        </StyledContentLayout>
      </Layout>
      <Drawer
        placement="left"
        width={280}
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        closable={false}
        bodyStyle={{ padding: 0 }}
      >
        <div
          style={{
            background: 'rgb(250, 250, 250)',
            padding: 8,
            position: 'sticky',
            top: 0,
            zIndex: 5,
            borderBottom: '1px solid var(--adm-color-border,#eee)',
          }}
        >
          <Button
            block
            onClick={() => setDrawerOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'inherit',
              border: 'none',
            }}
          >
            <span
              aria-hidden
              style={{ display: 'inline-flex', width: 14, height: 14 }}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.9a1 1 0 0 0 1.41-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4z" />
              </svg>
            </span>
            Close Sidebar
          </Button>
        </div>
        <Sidebar {...sidebar} onOpenSettings={settings.openModal} />
      </Drawer>
      <Settings {...settings.state} onClose={settings.closeModal} />
    </SimpleLayout>
  );
}
