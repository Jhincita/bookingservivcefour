import { WebpayService } from './webpay.service';

async function testWebpayService(){
    console.log('Testing webpay service\n');

    // test 1 . initialize
    console.log('testing initialization..');
    try {
        WebpayService.initialize();
        console.log('initialization OK');
    } catch (error) {
        console.log('initialization FAIL');
        return;
    }

    // Test 2 : create test transaction
    console.log('Testing test transaction creation ..');
    try {
        const result = await WebpayService.createTransaction(
            'TEST-ORDER-123',
            'TEST-SESSION-123',
            1000, // 1K CLP
            'http://localhost:3000/test-return'
        );

        if (result.success) {
            console.log('Transaction created! OK');
            console.log('Token:', result.token);
            console.log('URL: ', result.url);
            console.log('\n ALL TESTS OK')
        } else{
            console.log('transaction creation ERROR: ', result.error);
        }
    } catch (error) {
        console.log('transaction creation ERROR: ', error);
    }
}

// run test:
testWebpayService();