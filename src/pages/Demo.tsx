import { Navigate } from 'react-router-dom';

// The standalone Demo page has been retired. /demo now redirects to /practice
// per the unified entry-point policy.
const Demo = () => <Navigate to="/practice" replace />;

export default Demo;
