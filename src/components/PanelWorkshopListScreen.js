import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Empty, Input, List, Row, Space, Tag, Typography, message } from 'antd';
import { EnvironmentOutlined, MailOutlined, PhoneOutlined, SearchOutlined, ToolOutlined } from '@ant-design/icons';
import { getPanelWorkshopStates, getPanelWorkshopsByState } from '../services/workshopService';

const { Text, Title } = Typography;

function PanelWorkshopListScreen() {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('Johor');
  const [workshops, setWorkshops] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingWorkshops, setLoadingWorkshops] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    loadWorkshops(selectedState);
  }, [selectedState]);

  const filteredWorkshops = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    if (!normalizedSearch) {
      return workshops;
    }

    return workshops.filter((workshop) =>
      [workshop.name, workshop.address, workshop.phone, workshop.fax, workshop.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [workshops, searchText]);

  async function loadStates() {
    setLoadingStates(true);
    try {
      const result = await getPanelWorkshopStates();
      const normalizedStates = result.length ? result : ['Johor'];
      setStates(normalizedStates);
      setSelectedState(normalizedStates.includes('Johor') ? 'Johor' : normalizedStates[0]);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Unable to load panel workshop states.');
      setStates(['Johor']);
      setSelectedState('Johor');
    } finally {
      setLoadingStates(false);
    }
  }

  async function loadWorkshops(state) {
    if (!state) {
      return;
    }

    setLoadingWorkshops(true);
    try {
      const result = await getPanelWorkshopsByState(state);
      setWorkshops(result);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Unable to load panel workshops.');
      setWorkshops([]);
    } finally {
      setLoadingWorkshops(false);
    }
  }

  return (
    <div className="portal-dashboard-stack">
      <div className="portal-dashboard-hero portal-dashboard-theme-soft">
        <div className="portal-dashboard-hero-content">
          <span className="portal-dashboard-kicker portal-dashboard-kicker-soft">Panel Workshop</span>
          <Title level={2} className="portal-dashboard-title">Panel Workshop</Title>
          <Text className="portal-dashboard-description">
            Find an approved panel workshop by state before choosing your repair appointment.
          </Text>
          <div className="portal-dashboard-chip-row">
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">States</span>
              <span className="portal-dashboard-chip-value">{states.length}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Selected State</span>
              <span className="portal-dashboard-chip-value">{selectedState || 'None'}</span>
            </div>
            <div className="portal-dashboard-chip portal-dashboard-chip-soft">
              <span className="portal-dashboard-chip-label">Workshops</span>
              <span className="portal-dashboard-chip-value">{filteredWorkshops.length}</span>
            </div>
          </div>
        </div>
      </div>

      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 24 }}
        message="Search by state"
        description="Choose a state on the left, then search by workshop name, address, phone, fax, or email."
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} md={7} lg={6}>
          <Card
            title="States"
            loading={loadingStates}
            style={{ borderRadius: 12 }}
          >
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {states.map((state) => (
                <Button
                  key={state}
                  block
                  type={state === selectedState ? 'primary' : 'default'}
                  onClick={() => {
                    setSelectedState(state);
                    setSearchText('');
                  }}
                  style={{ textAlign: 'left', height: 42 }}
                >
                  {state}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={17} lg={18}>
          <Card style={{ borderRadius: 12 }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                <Space>
                  <ToolOutlined style={{ color: '#c2410c', fontSize: 22 }} />
                  <div>
                    <Title level={4} style={{ margin: 0 }}>{selectedState}</Title>
                    <Text type="secondary">{filteredWorkshops.length} workshop(s)</Text>
                  </div>
                </Space>
                <Tag color="processing">Panel workshops</Tag>
              </Space>

              <Input
                allowClear
                size="large"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search workshop name, area, phone, fax or email"
              />

              <List
                loading={loadingWorkshops}
                dataSource={filteredWorkshops}
                locale={{ emptyText: <Empty description="No panel workshops found for this state or search." /> }}
                renderItem={(workshop) => (
                  <List.Item>
                    <Card size="small" style={{ width: '100%', borderRadius: 8 }}>
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Text strong style={{ fontSize: 16 }}>{workshop.name}</Text>
                        <Text><EnvironmentOutlined /> {workshop.address || 'Address not available'}</Text>
                        <Space wrap>
                          {workshop.phone ? <Tag icon={<PhoneOutlined />}>Tel: {workshop.phone}</Tag> : null}
                          {workshop.fax ? <Tag>Fax: {workshop.fax}</Tag> : null}
                          {workshop.email ? <Tag icon={<MailOutlined />}>{workshop.email}</Tag> : null}
                        </Space>
                      </Space>
                    </Card>
                  </List.Item>
                )}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default PanelWorkshopListScreen;
