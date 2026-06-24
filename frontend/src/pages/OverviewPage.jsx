import PageHeader from '../components/PageHeader.jsx';
import { useAppContext } from '../context/AppContext.jsx';

const OverviewPage = () => {
  const { user } = useAppContext();

  return (
    <div className="page-container">
      <PageHeader 
        title={`Welcome, ${user?.name || 'Head'}`}
        subtitle="School Overview and Analytics"
      />
      <div className="card">
        <h3>School Statistics</h3>
        <p className="text-muted overview-text">
          Overview content will be displayed here.
        </p>
      </div>
    </div>
  );
};

export default OverviewPage;
