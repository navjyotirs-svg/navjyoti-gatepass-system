import { submitVisitorRequest } from './src/app/actions/submitRequest';
import { resolveHostForNotification } from './src/lib/server/hostResolution';

async function test() {
  try {
    const hostInfo = await resolveHostForNotification({ type: 'employee', employeeId: '356f1097-1537-46b6-aeaf-30dad934b859' });
    console.log("Host Info:", hostInfo);

    const formData = {
      visitorName: 'Test Visitor',
      visitorMobile: '9999999999',
      visitorEmail: 'test@example.com',
      purpose: 'Testing email dispatch',
      visitorPhotoPath: '/uploads/test.jpg',
      hostSelection: {
        type: 'employee',
        id: '356f1097-1537-46b6-aeaf-30dad934b859'
      }
    };
    
    console.log("Submitting...");
    const result = await submitVisitorRequest(formData);
    console.log("Result:", result);
  } catch (e) {
    console.error(e);
  }
}
test();
