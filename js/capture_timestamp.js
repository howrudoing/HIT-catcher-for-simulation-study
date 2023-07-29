
// Display a specific timestamp
function displayTimeStamp(comment, timeToDisplay) {
    document.getElementById("display_current_timestamp").innerHTML = "";

    var node = document.createElement("LI");
    var textnode = document.createTextNode(comment + timeToDisplay);
    node.appendChild(textnode);
    document.getElementById("display_current_timestamp").appendChild(node);
}

// Get the current time in milliseconds
function getCurrentTime() {
    var myDate = new Date().getTime();
    return myDate;
}

// 立即接收任务模块 添加到UI
// Inject a button to send http request to server to accept the task.
function addSimpleCatchertoUI() {

    // Add event listener to the button
    document.getElementById('send_acceptance_request').addEventListener('click', async function () {

        // Read the Project ID input by the user.
        let projectID = document.getElementById('project_id').value;
        // Try to accept a random task with specific project ID
        let response = await fetch('https://workersandbox.mturk.com/projects/' + projectID + '/tasks/accept_random?ref=w_pl_prvw');
        // The response is not JSON.
        let commits = await response.text();

        // Parse down the number after the timeRemainingInSeconds&quot;:
        // Use lazy quantifier to locate the two string with the nearest distance.
        const regex = /(?<=timeRemainingInSeconds&quot;:)(.*)(?=,)/;
        const timeRemaining = commits.match(regex);

        // current timestamp + timeRemainingInSec*1000 = time to start catching.
        const output = getCurrentTime() + timeRemaining[0] * 1000;
        // Display the output in the inserted div
        const comment = 'The parsed time remaining is: ' + timeRemaining[0] + ' Seconds.';

        displayTimeStamp(comment, output);

        // AutoPaste this ID to the timing catcher
        document.getElementById('timing_project_id').value = projectID;
        // AutoPaste the expiration time to the timing catcher
        document.getElementById('scheduled_time').value = output;
    });
}

// Catch the task at the set timestamp
function runTimingCatcher() {
    var currentTime = getCurrentTime();
    var scheduledTime = document.getElementById('scheduled_time').value;
    if (scheduledTime != "") {
        var time_to_wait = scheduledTime - currentTime;
        if (time_to_wait > 0) {
            console.log('Catcher starts automatically in ' + time_to_wait / 1000 + ' seconds.');
            setTimeout(function () {
                sendAcceptRequest();
            }, time_to_wait);
        }
        else {
            alert("Please input a valid timestamp!");
        }
    }
    else {
        alert("Please input a timestamp.");
    }

}

var count = 0;
var interval = 1000;
var keepAccepting = true;

// 循环发送任务请求 的 循环模块
function sendAcceptRequestLoop() {
    setTimeout(function () {
        sendAcceptRequest();
        count += 1;
        if (keepAccepting) {
            sendAcceptRequestLoop();
        }
    }, interval);
}

// 循环发送任务请求 的 触发模块
function startRequestLoop() {
    keepAccepting = true;
    count = 0;
    sendAcceptRequestLoop();
}

// 循环发送任务请求 的 终止模块
function stopRequestLoop() {
    keepAccepting = false;
}

// 在特定的时间戳 开启 循环发送任务请求 
// creates a loop iterating over async iterable objects: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
function runTimingCatcherLoop() {

    var currentTime = getCurrentTime();
    var scheduledTime = document.getElementById('scheduled_time').value;
    var time_to_wait = scheduledTime - currentTime;

    // The frequency is 1s by default
    if (document.getElementById('catcher_frequency').value != '') {
        interval = document.getElementById('catcher_frequency').value;
        console.log('The catcher will run each ' + interval + ' miliseconds.');
    }

    // 如果不定义开启时刻则立刻执行
    if (scheduledTime == "") {
        startRequestLoop();
    }
    else if (time_to_wait > 0) {
        console.log('Catcher starts automatically in ' + time_to_wait / 1000 + ' seconds.');
        setTimeout(function () {
            startRequestLoop();
        }, time_to_wait);
    }
}

// Declare an array that writes data to csv. As this array needs to be revoked by user clicking, it needs to be a global variable.
var storeToCsv = [];

/*  
    This function should record network latency with ping. 
    For more details: https://www.open-open.com/lib/view/open1414937432419.html
    The asynchronous request function will invoke this function with Callbacks 
 */
// start request loop 和 start timing catcher 所调用的任务接收模块
async function sendAcceptRequest() {

    const project_id = document.getElementById('timing_project_id').value;
    // Accept the HIT based on its unique ID.
    const response = await fetch(`https://workersandbox.mturk.com/projects/${project_id}/tasks/accept_random?format=json`, {
        credentials: `include`,
    });

    if (response.status == 200 || response.status == 429 || response.status == 422) {

        const status = response.status;
        currentTime = getCurrentTime();

        if (status === 200) {

            // displayTimeStamp(comment, currentTime);
            // The response is not JSON.
            let commits = await response.text();
            // This is where we get the time remaining for this task.
            // Parse down the number after the timeRemainingInSeconds&quot;:
            // Use lazy quantifier to locate the two strings with the nearest distance.
            const regex = /(?<=timeRemainingInSeconds&quot;:)(.*)(?=,)/;
            const timeRemaining = commits.match(regex);

            // 匹配出收到HIT的task_ID
            const regex2 = /(?<=tasks\/)(.*)(?=\?)/;
            const task_ID = commits.match(regex2);

            // current timestamp + timeRemainingInSec*1000 = time to start catching.
            const output = currentTime + timeRemaining[0] * 1000;
            // Display the output in the inserted div
            var comment = 'Successfully caught at: ' + currentTime + '.\nThe expiration time is: ' + output + '.\nThe task ID is: ' + task_ID;
            console.log(comment);

            // 记录归档
            storeToCsv.push([currentTime, task_ID, 'success']);

            // 成功接收一个任务后暂停模块
            // keepAccepting = false;
        }
        // If it fails to get response, it will record this page request error:
        else if (status === 429) {
            console.log('Too many requests! The time for PRE is ' + currentTime + '\n');
            // 记录归档
            storeToCsv.push([currentTime, '', 'PRE']);

        }
        // If the HIT queue is full
        else if (status === 422) {
            console.log('HIT Queue is full or bad request format.');
            // 记录归档
            storeToCsv.push([currentTime, '', 'Unprocessable Entity']);
        }
    } else {
        console.log('An error occurred.');
        // 记录归档
        storeToCsv.push([currentTime, '', 'Error']);
    }
}

// Display current timestamps
function get_Current_TimeStamp() {
    document.getElementById("display_current_timestamp_2").innerHTML = "";

    // Current timestamp
    var timeToDisplay = getCurrentTime();
    var node = document.createElement("LI");
    var textnode = document.createTextNode('Current timestamp is:\n' + timeToDisplay);
    node.appendChild(textnode);
    document.getElementById("display_current_timestamp_2").appendChild(node);

    // timestamp in 40 seconds
    timeToDisplay = timeToDisplay + 40 * 1000;
    node = document.createElement("LI");
    textnode = document.createTextNode('After 40 seconds, it is:\n' + timeToDisplay);
    node.appendChild(textnode);
    document.getElementById("display_current_timestamp_2").appendChild(node);
}

var p = new Ping();
var storePingLogToCsv = [];

// 测量到服务器延迟的模块
function ping_server() {
    p.ping("http://workersandbox.mturk.com", function (err, data) {
        if (err) {
            console.log("error loading resource")
            data = data + " " + err;
        }
        // 将时间进行归档
        storePingLogToCsv.push([getCurrentTime(), data]);
        console.log('Ping is: '+data);
    });
}

// 间隔两秒ping一次服务器
function ping_server_recurrently() {
    setTimeout(function () {
        ping_server();
        ping_server_recurrently();
    }, 2000);
}

// 点击启动Ping模块
function addPingtoUI() {
    document.getElementById('run_ping_test').addEventListener('click', function () {
        ping_server_recurrently();
        console.log('Start pinging server.');
    });
}



// 将监测信息下载到本地
function download_ping_log_to_csv() {
    var csv = 'Timestamp,Ping\n';
    storePingLogToCsv.forEach(function (row) {
        csv += row.join(',');
        csv += "\n";
    });
    // console.log(csv);
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'ping_log.csv';
    hiddenElement.click();
}

document.getElementById("download_ping_log_to_csv").addEventListener("click", download_ping_log_to_csv);

// 记录下载到本地用于分析
// Insert the stored timestamps into the CSV upon user's clicking for further analysis
function download_csv() {
    var csv = 'Timestamp,Task_ID,Event\n';
    storeToCsv.forEach(function (row) {
        csv += row.join(',');
        csv += "\n";
    });
    // console.log(csv);
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'timestamps.csv';
    hiddenElement.click();
}

document.getElementById("download_csv").addEventListener("click", download_csv);

// Allow user to set the ProjectID and time to catch the task.
function addTimingCatchertoUI() {
    // Events listener
    document.getElementById('start_timer').addEventListener('click', function () {
        runTimingCatcher();
        console.log('Timing catcher started!');
    });
}

// Click to run the request loop every fixed duration.
function addTimingCatcherLooptoUI() {
    document.getElementById('start_loop').addEventListener('click', function () {
        if (document.getElementById('timing_project_id').value !== '') {
            runTimingCatcherLoop();
            console.log('Request loop started!');
        }
        else {
            alert('Please type in a Batch ID.');
        }
    });
}

// 点击取消连续请求任务
function addStoppertoUI() {
    document.getElementById('stop_loop').addEventListener('click', function () {
        stopRequestLoop();
        console.log('Request loop stopped!');
    });
}

// function addTimestampPrintertpUI() {
//     document.getElementById("get_current_timestamp").addEventListener("click", get_Current_TimeStamp);
// }

var keepRefreshing = true;

// 注入搜索脚本到页面 模块
function injectScriptToPage() {
    setTimeout(function () {
        chrome.tabs.executeScript({
            file: "js/auto_refresh_search.js"
        });
        // 实现自循环
        if (keepRefreshing) {
            injectScriptToPage();
        }
    }, 1500);
}

// 点击连续刷新当前页面
function addRefreshertoUI() {
    document.getElementById('auto_refresh_current_tab').addEventListener('click', function () {
        // 每次搜索前都假设尚未发现目标任务
        keepRefreshing = true;

        // 监听目标页面
        messageListener();

        injectScriptToPage();
    });
}

// 点击停止连续刷新模块
function addStopRefreshertoUI() {
    document.getElementById('stop_auto_refresher').addEventListener('click', function () {
        keepRefreshing = false;
        console.log('Refresher stopped.');
    });
}

// 定义一个储存refresher日志的数组
var storeRefresherLogToCsv = [];

function messageListener() {
    console.log('Start monitoring batch list');
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        // 根据搜索结果决定是否继续刷新页面
        // keepRefreshing = request.keepRefreshing;

        // 如果收到message，则将其归档进行表格写入
        storeRefresherLogToCsv.push([request.visibleTime, request.visibleNumOfHIT]);

        console.log(request.message + '  >>>>>  ' + request.visibleNumOfHIT + 'visible HITs');
        // Callback for that request
        sendResponse({ message: "Background has received that message" });
    });
}

// 将监测信息下载到本地
function download_refresher_log_to_csv() {
    var csv = 'Timestamp,Number of visible HITs\n';
    storeRefresherLogToCsv.forEach(function (row) {
        csv += row.join(',');
        csv += "\n";
    });
    // console.log(csv);
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'refresher_log.csv';
    hiddenElement.click();
}

document.getElementById("download_refresher_log_to_csv").addEventListener("click", download_refresher_log_to_csv);

// 页面打开时自动focus到ID输入框
function focusOnBatchID() {
    document.getElementById("timing_project_id").focus();
}

// Return the task before expiring.
// Sample return request: https://workersandbox.mturk.com/projects/3BK5FW2G7PCPPCGLICSOBZZDKUARCF/tasks/3N5YJ55YYJHFCZTKML45M1I1MC9NA4?assignment_id=3FTOP5WARJ2PFG2A6NKMS8KN84V0JO&ref=w_wp_rtrn_top
// https://workersandbox.mturk.com/projects/3I2IYPM30WC6FL7VTV3A7MH3KMZJ8D/tasks/3MDWE879VKGZ67UIRPLWZB7NZ5E9BN?assignment_id=3QILPRALQ993GVYYGPPTEU7M0MBN81&ref=w_wp_rtrn_bttm

// Add event listeners to the popup window.
addSimpleCatchertoUI();
addTimingCatchertoUI();
addTimingCatcherLooptoUI();
addStoppertoUI();
addRefreshertoUI();
addStopRefreshertoUI();
addPingtoUI();
focusOnBatchID();
