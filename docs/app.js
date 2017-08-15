// Add: http://www.mburnette.com/blog/toggle-password-field-text-visibility#finalCode

$(document).ready(function(){
    setUp();
    //$('input:password').bind('keyup', checkpass);
});

const minTriggerLength = 2; // When to start triggering minimum length warnings
const minPassLength = 8; // Minimum password length.
const solidPassLength = 20; // Password considered 'solid', thus removing upper, lower, etc. rules.
const maxPassLength = 256; // Maximum password length - should match maxlength on password fields.
// Words to not allow in passwords. Note these are hardcorded into uiState.advisors.ours.text.* 
const ourWords = ['zephyrboard', 'hoverboard']; 

// Selectors for the various password fields.
const $password = {
    mainLabel: $('#main-password-label'),
    main: $('#main-password'),
    visibleLabel: $('#visible-password-label'),
    visible: $('#visible-password'),
    confirmArea: $('#confirm-area'),
    confirmField: $('#confirm-password'),
    showTypingSwitch: $('#show-typing-switch'),
    showTypingArea: $('#show-typing-area')
};

// Data to use when updating advisor fields. 
const uiData = {
    start: {
        classNamed: 'adviseStart',
        imageName: 'img/star.svg',
        en:{
            imageAlt: ''
        }
    },
    pass: {
        classNamed: 'advisePass',
        imageName: 'img/checked.svg',
        en: {
            imageAlt: 'Passed'
        }
    },
    fail: {
        classNamed: 'adviseFail',
        imageName: 'img/error.svg',
        en: {
            imageAlt: 'Error'
        }
    },
    wait: {
        classNamed: 'adviseWait',
        imageName: 'img/none.svg',
        en: {
            imageAlt: 'Not required'
        }
    }
};

// States the advisors can be in
const adviseState = {
    start: 1, // black dot, grey 'wait' text
    pass: 2, // Green checkbox and text, 'pass' text
    fail: 3, // Red fail box and text, 'fail' text
    wait: 4 // Grey empty checkbox and text, wait text
};

// Main state of the application.
// It's like a state machine without being one.
// Stores the state of all advisors. 
// StateBuilder does most of the work to change these.
let uiState = {
    advisors: {    
        eight: {
            state: adviseState.wait,
            show: true,
            sel: $('#advisor8char'),
            text: {
                wait: 'At least 8 characters',
                pass: 'Has 8 characters',
                fail: 'Need at least 8 characters'
            }
        },
        upper: {
            state: adviseState.wait,
            show: true,
            sel: $('#advisor1upper'),
            text: {
                wait: 'One uppercase letter',
                pass: 'Has an uppercase letter',
                fail: 'Need 1 uppercase letter'
            }
        },
        lower: {
            state: adviseState.wait,
            show: true,
            sel: $('#advisor1lower'),
            text: {
                wait: 'One lowercase letter',
                pass: 'Has a lowercase letter',
                fail: 'Need 1 lowercase letter'
            }
        },
        number:  {
            state: adviseState.wait,
            show: true,
            sel: $('#advisor1number'),
            text: {
                wait: 'One number',
                pass: 'Has a number',
                fail: 'Need 1 number'
            }
        },
        symbol:  {
            state: adviseState.wait,
            show: true,
            sel: $('#advisor1symbol'),
            text: {
                wait: 'One symbol',
                pass: 'Has a symbol',
                fail: 'Need 1 symbol(*, /, !, etc.)'
            }
        },
        common:  {
            state: adviseState.wait,
            show: true,
            sel: $('#advisorCommonPassword'),
            text: {
                wait: 'Avoid common passwords',
                pass: 'Not a common password',
                fail: 'This is a common password'
            }
        },
        ours:  {
            state: adviseState.wait,
            show: true,
            sel: $('#advisorNotOurName'),
            text: {
                wait: 'Do not include the words \'zephyrboard\' or \'hoverboard\'',
                pass: 'Does not include the words \'zephyrboard\' or \'hoverboard\'',
                fail: 'Can not contain \'zephyrboard\' or \'hoverboard\''
            }
        },
        strong:  {
            state: adviseState.pass,
            show: false,
            sel: $('#advisor20char'),
            text: {
                wait: 'At least 20 characters',
                pass: 'Has at least 20 characters',
                fail: 'At least 20 characters'
            }
        },
        max:  {
            state: adviseState.fail,
            show: false,
            sel: $('#advisorOver256'),
            text: {
                wait: 'Not over 256 characters',
                pass: 'Less than 256 characters',
                fail: 'Can not be over 256 characters'
            }
        },
        passmatch:  {
            state: adviseState.wait,
            show: false,
            sel: $('#advisorConfirmMatch'),
            text: {
                wait: 'Passwords need to match',
                pass: 'Passwords match',
                fail: 'Passwords do not match'
            }
        },
        reset: function () {
            this.eight.state = this.upper.state = 
            this.lower.state = this.number.state = 
            this.symbol.state = this.common.state = 
            this.ours.state = this.passmatch.state = 
                adviseState.wait;

            this.eight.show = this.upper.show = 
            this.lower.show = this.number.show = 
            this.symbol.show = this.common.show = 
            this.ours.show = true;

            this.strong.show = this.max.show = 
            this.passmatch.show = false;
        }
    },
    canSubmit: false,
    hideConfirmArea: false,
    canSubmitErrors:[],
};

/* Updates the Advisors based on input from the uiState */
const advisorsOptics = {
    hide: function (advisorsIn) {
        let advisors = [].concat(advisorsIn);
        advisors.map(function (advisor) {
            if (advisor['sel'].is(':visible')) {
                advisor['sel'].fadeOut(1000);
            }
        });
    },
    show: function (advisorsIn) {
        let advisors = [].concat(advisorsIn);
        advisors.map(function (advisor) {
            if (advisor['sel'].is(':hidden')) {
                advisor['sel'].fadeIn(1000);
            }
        });
    },
    clearAdviseStatus: function (advisorsIn) {
        let advisors = [].concat(advisorsIn);
        advisors.map(function (advisor) {
            advisor['sel'].removeClass(uiData.pass.classNamed + 
                ' ' + uiData.fail.classNamed + 
                ' ' + uiData.wait.classNamed +
                ' ' + uiData.start.classNamed
                );
        });
    },
    waitPassFail: function (advisorsIn, adviseData, advisorTextVar) {
        let advisors = [].concat(advisorsIn);
        let that = this;
        advisors.map(function (advisor) {
            if (!advisor['sel'].hasClass(adviseData.classNamed)) {
                // Set class
                that.clearAdviseStatus([advisor]);
                advisor['sel'].addClass(adviseData.classNamed);
                // Set Image
                let adviseImage = advisor['sel'].find('img');
                adviseImage.attr('src', adviseData.imageName);
                adviseImage.attr('alt', adviseData.en.imageAlt);
                // Set Text
                let newText = advisor.text[advisorTextVar];
                advisor['sel'].find('.aText').text(newText);
            }
        });
    },
    pass: function(selectors) {
        this.waitPassFail(selectors, uiData.pass, 'pass');
    },
    fail: function(selectors) {
        this.waitPassFail(selectors, uiData.fail, 'fail');
    },
    wait: function(selectors) {
        this.waitPassFail(selectors, uiData.wait, 'wait');
    },
    start: function(selectors) {
        this.waitPassFail(selectors, uiData.wait, 'wait');
    },
    updateFromState: function(uiStateIn) {
        for (let key in uiStateIn.advisors) {
            if (uiStateIn.advisors.hasOwnProperty(key)
                && uiStateIn.advisors[key].hasOwnProperty('sel')) {
                const advisor = uiStateIn.advisors[key];
                switch (advisor['state']) {
                case adviseState.wait:
                    this.wait(advisor);
                    break;
                case adviseState.fail:
                    this.fail(advisor);
                    break;
                case adviseState.pass:
                    this.pass(advisor);
                    break;
                case adviseState.start:
                    this.start(advisor);
                    break;
                }
                if (advisor['show']) {
                    this.show(advisor);
                } else {
                    this.hide(advisor);
                }
            }
        }
    }
};

const continueButtonOptic  = function(uiStateIn) {
    if (uiStateIn.canSubmit) {
        $('#continue-button').prop('disabled', false);
    } else {
        $('#continue-button').prop('disabled', true);
    }
    let mainpasslabel = 'Password.';
    let visiblepasslabel = 'Visible password.';
    if (uiStateIn.canSubmitErrors.length > 0) {
        mainpasslabel = mainpasslabel + ' Errors: ' + uiStateIn.canSubmitErrors.join(', ');
        visiblepasslabel = visiblepasslabel + ' Errors: ' + uiStateIn.canSubmitErrors.join(', ');
    }
    $password.main.attr('aria-label', mainpasslabel);
    $password.visible.attr('aria-label', visiblepasslabel);
};

/* State builder runs the password rules
 * Input: uiState
 * Returns: uiState
 */
const stateBuilder = {
    /* Some of these are used under MIT license from owasp-password-strength-test.js
     * I didn't use the full import because we didn't need all of it's functionality.
     */
    oneUpper: function (password) {
        return (!/[A-Z]/.test(password)) ? false : true;
    },
    oneLower: function (password) {
        return (!/[a-z]/.test(password)) ? false : true;
    },
    oneNumber: function (password) {
        return (!/[0-9]/.test(password)) ? false : true;
    },
    oneSymbol: function (password) {
        return (!/[^A-Za-z0-9]/.test(password)) ? false : true;
    },
    notCommon: function(password) {
        return (bloom.test(password)) ? false : true;
    },
    notOurs: function(password) {
        let ourWordsFound = false;
        ourWords.map(function(thisWord) {
            if (password.indexOf(thisWord) > -1) {
                ourWordsFound = true;
            }
        });
        return (ourWordsFound) ? false : true;
    },
    runMainPasswordWordsSub: function(uiStateIn, password) {
       // Ours
        uiStateIn.advisors.ours.show = true;
        if (this.notOurs(password)) {
            uiStateIn.advisors.ours.state = adviseState.pass;
        } else {
            uiStateIn.advisors.ours.state = adviseState.fail;
            uiStateIn.canSubmit = false;
            uiStateIn.canSubmitErrors.push(uiStateIn.advisors.ours.text.fail);
        }

        // Not Common
        uiStateIn.advisors.common.show = true;
        if (this.notCommon(password)) {
            uiStateIn.advisors.common.state = adviseState.pass;
        } else {
            uiStateIn.advisors.common.state = adviseState.fail;
            uiStateIn.canSubmit = false;
            uiStateIn.canSubmitErrors.push(uiStateIn.advisors.common.text.fail);
        }
        return uiStateIn;
    },
    runMainPasswordMinToSolid: function(uiStateIn, password) {
       // Between minimum password and solid password = show eight and test everything.
       // eight - passes by default.
        uiStateIn.advisors.eight.state = adviseState.pass;
        uiStateIn.advisors.eight.show = true;

        // lower - Run tests
        uiStateIn.advisors.lower.show = true;
        if (this.oneLower(password)) {
            uiStateIn.advisors.lower.state = adviseState.pass;
        } else {
            uiStateIn.advisors.lower.state = adviseState.fail;
            uiStateIn.canSubmit = false;
            uiStateIn.canSubmitErrors.push(uiStateIn.advisors.lower.text.fail);
        }

        // Upper- Run tests
        uiStateIn.advisors.upper.show = true;
        if (this.oneUpper(password)) {
            uiStateIn.advisors.upper.state = adviseState.pass;
        } else {
            uiStateIn.advisors.upper.state = adviseState.fail;
            uiStateIn.canSubmit = false;
            uiStateIn.canSubmitErrors.push(uiStateIn.advisors.upper.text.fail);
        }

        // Symbol- Run tests
        uiStateIn.advisors.symbol.show = true;
        if (this.oneSymbol(password)) {
            uiStateIn.advisors.symbol.state = adviseState.pass;
        } else {
            uiStateIn.advisors.symbol.state = adviseState.fail;
            uiStateIn.canSubmit = false;
            uiStateIn.canSubmitErrors.push(uiStateIn.advisors.symbol.text.fail);
        }

        // Number- Run tests
        uiStateIn.advisors.number.show = true;
        if (this.oneNumber(password)) {
            uiStateIn.advisors.number.state = adviseState.pass;
        } else {
            uiStateIn.advisors.number.state = adviseState.fail;
            uiStateIn.canSubmit = false;
            uiStateIn.canSubmitErrors.push(uiStateIn.advisors.number.text.fail);
        }

        // Words - Run tests
        uiStateIn = this.runMainPasswordWordsSub(uiStateIn, password);

        // We are not either maxed or strong, so hide them.
        uiStateIn.advisors.max.show = false;
        uiStateIn.advisors.strong.show = false;
        return uiStateIn;
    },
    runMainPasswordAboveSolid: function(uiStateIn, password) {
        // Solid pass but less than max = hide all composite items, show solid.
        uiStateIn.advisors.eight.show = false;
        uiStateIn.advisors.upper.show = false;
        uiStateIn.advisors.lower.show = false;
        uiStateIn.advisors.symbol.show = false;
        uiStateIn.advisors.number.show = false;

        uiStateIn = this.runMainPasswordWordsSub(uiStateIn, password);

        uiStateIn.advisors.strong.show = true;
        uiStateIn.advisors.max.show = false;
        return uiStateIn;
    },
    runMainPasswordAboveMax: function(uiStateIn, password) {
        // Note: our HTML has a maxlength prop so this should never actually trigger.
        // However, it could be used if we're returning from server.
        // 
        uiStateIn.advisors.eight.show = false;
        uiStateIn.advisors.upper.show = false;
        uiStateIn.advisors.lower.show = false;
        uiStateIn.advisors.symbol.show = false;
        uiStateIn.advisors.number.show = false;
        uiStateIn.advisors.strong.show = false;
       
        uiStateIn.advisors.strong.show = true;
        uiStateIn.advisors.max.show = true;
        uiStateIn.canSubmit = false;

        uiStateIn = this.runMainPasswordWordsSub(uiStateIn, password);
        return uiStateIn;
    },
    runMainPassword: function(uiStateIn) {
        const password = passwordValue();
        var length = password.length;
        if (length === 0) {
            uiStateIn.advisors.reset();
            uiStateIn.canSubmit = false;
            uiStateIn.canSubmitErrors.push(uiStateIn.advisors.eight.text.fail);
        } else if (length > 0 && length < minTriggerLength) {
            // Less than minimum trigger length of the password = 
            uiStateIn.advisors.reset();
            uiStateIn.canSubmit = false;
            uiStateIn.canSubmitErrors.push(uiStateIn.advisors.eight.text.fail);

        } else if (length >= minTriggerLength && length < minPassLength) {
            // Between min trigger and min limit = show eight as failing, others are waiting.
            uiStateIn.advisors.reset();
            uiStateIn.advisors.eight.state = adviseState.fail;
            uiStateIn.canSubmit = false;
            uiStateIn.canSubmitErrors.push(uiStateIn.advisors.eight.text.fail);

        } else if (length >= minPassLength && length < solidPassLength) {
            // Between minimum password and solid password = show eight and test everything.
            uiStateIn = this.runMainPasswordMinToSolid(uiStateIn, password);

        } else if (length >= solidPassLength && length <= maxPassLength) {
            // Between solid and max
            uiStateIn = this.runMainPasswordAboveSolid(uiStateIn, password);

        } else if (length > maxPassLength) {
            uiStateIn = this.runMainPasswordAboveMax(uiStateIn, password);

        }
        return uiStateIn;
    },
    runConfirmPassword: function(uiStateIn) {
        if (uiStateIn.hideConfirmArea) {
            return uiStateIn;
        }
        let confirmVal = $password.confirmField.val();
        if (confirmVal.length > 0) {
            if (confirmVal === passwordValue()) {
                uiStateIn.advisors.passmatch.state = adviseState.pass;
                uiStateIn.advisors.passmatch.show = true;
            } else {
                uiStateIn.advisors.passmatch.state = adviseState.fail;
                uiStateIn.canSubmit = false;
                uiStateIn.canSubmitErrors.push(uiStateIn.advisors.passmatch.text.fail);
            }
            uiStateIn.advisors.passmatch.show = true;
        } else {
            uiStateIn.canSubmit = false;
            uiStateIn.advisors.passmatch.show = false;
            uiStateIn.advisors.passmatch.state = adviseState.wait;
            uiStateIn.canSubmitErrors.push(uiStateIn.advisors.passmatch.text.fail);
        }
        return uiStateIn;
    },
    run: function(uiStateIn) {
        uiStateIn.canSubmit = true;
        uiStateIn.canSubmitErrors = [];

        uiStateIn = this.runMainPassword(uiStateIn);
        uiStateIn = this.runConfirmPassword(uiStateIn);
        return uiStateIn;
    }
};

// Returns the current password value, regardless of whether the password is visible or not
function passwordValue() {
    if ($password.main.is(':visible')) {
        return $password.main.val();
    } else {
        return $password.visible.val();
    }
}

/* Toggles password visibility then runs the uiUpdate through checkPassword
    We have to run the uiUpdate because if the confirm area is hidden, we no
    longer check if the passwords match.
*/
function togglePasswordVisibility(e) {
    if ($password.main.is(':visible')) {
        $password.showTypingSwitch.attr('aria-checked', 'true');
        $password.visible.val($password.main.val());
        $password.main.hide();
        $password.visible.show();
        $password.visibleLabel.show();
        $password.confirmArea.fadeOut();
        uiState.hideConfirmArea = true;
    } else {
        $password.showTypingSwitch.attr('aria-checked', 'false');
        $password.main.val($password.visible.val());
        $password.main.show();
        $password.visible.hide();
        $password.visibleLabel.hide();
        $password.confirmArea.fadeIn();
        uiState.hideConfirmArea = false;
    }
    // -- prevent any default actions
    e.preventDefault();
    checkPassword();
}

/* Checks the passwords, visible and confirm areas as necessary */
function checkPassword () {
    uiState = stateBuilder.run(uiState);
    advisorsOptics.updateFromState(uiState);
    console.log('uiState update: ', uiState);
    continueButtonOptic(uiState);
}

/* Show the clicked button action */
function continueClicked(e) {
    $('#created-message').show();
    e.preventDefault();
}

function setUp () {
    checkPassword();
    $password.main.bind('keyup', checkPassword);
    $password.visible.bind('keyup', checkPassword);
    $password.confirmField.bind('keyup', checkPassword);
    $('#continue-button').click(continueClicked);

    // Set up toggling of visible password
    $password.showTypingArea.show();
    $password.mainLabel.css('margin-bottom','-35px');
    $password.showTypingSwitch.click(togglePasswordVisibility);
}

/* Bloom filter contents */
var bloomSerialized = [-439730441,369124393,1455764693,1039183023,-438452811,274633666,2017118330,-1083679579,277459415,-694090283,1595210512,2072346838,-535280350,851500334,1894895048,-2140033031,-197307316,-184884519,498455617,30594454,-1824336189,-49417782,-1650798695,1171854779,1489804185,952021531,1794101363,-1125357483,-380684180,1924601081,-117591813,-1914422317,834485227,-1064576314,417930702,2047251981,420001305,-1031040204,-1790566037,560801189,-109413505,-1790771908,1645795894,1896356183,551495931,1053425205,1824366557,-222363910,-717460538,-2003470024,-313745765,1920125831,-1762263849,-530696837,-143401208,-2112188941,1574133611,-1154218543,123089707,918478894,-1645096971,-1085588336,-4234196,1184590725,1853864523,1843109065,1125794340,-1703526241,390587798,278987690,-1462021193,1071545693,-1973111956,64095769,-278703393,-1944877642,1741923911,526418755,1572056546,486517833,-766032211,241819443,1106136079,-1675358696,1689722231,-1352303745,-495233584,961268003,1090161038,1150246849,-2020180497,891208993,-296647362,1518432043,-570683901,-26240391,623729466,8052139,607682303,-597262340,1797067454,590365765,1165222163,-1498686791,327880343,-1884638007,82888781,1229536928,577353754,264304251,2117228767,1401212086,-713371030,1604600124,2026846983,811298763,-24853863,1146059989,-924329265,251047709,319883203,-91852953,1943541346,-121637575,229738036,849200915,-1060700692,987232087,528837714,-1524122694,969591209,1544029000,-369116254,-649080296,-941433827,1117362083,-461131913,1242339315,-1484699698,1830257131,888017519,1310685537,1479666252,-1619257661,2035733240,1659216796,-987685249,-841748960,770820918,1862635675,-1319329176,-63163199,573876613,-538677839,-1445932927,-1392098009,1953682413,-655739543,-585669543,-734885668,1074649949,277777362,-1799834256,188435997,694464739,-1396087133,1467505048,1627781977,1551681131,1345197943,1284271674,22347561,2096205431,171437510,1488491423,942707341,-176505919,1446617331,820972270,-2019856342,1756117078,-2051034642,52553836,-1112544377,214331069,-78214242,1495218280,1016851547,2129294803,348744378,2004385623,-1902882724,1238629211,-74825194,-386590735,1057921648,1514247986,-604752831,38711487,-330864045,-1480510081,-906061231,44536596,1861511192,1297375130,-1426896113,1694733104,-1592540026,809075253,1218177325,174691783,-23582998,-923739190,-727630373,-1303584612,1082778629,-208928318,-282826767,-1714588957,601203836,-67314878,1406306581,-2000876631,1921142893,2145373256,-978370806,180749785,-192746590,1041880232,-2046228819,-288076809,790587884,-96502249,1251248370,-1735023154,1855372441,159459362,-829070318,-665234271,337751486,-562441915,-1935563013,-876729091,153009926,793638076,-1077780423,1804576620,-46707910,-879605259,1724872673,1192035835,778213838,-817514062,-1696308640,1855810589,-723753674,14694436,-1106857341,-350344979,-725059027,-1585730551,-1510259781,2023196023,2057896171,-2022985893,154360826,-1277776099,1251156099,-1805943438,80312155,1009342440,-1783810578,-1931047938,-708177796,881328124,440306983,677653089,-2123500174,-485022460,-652282074,1932553691,1149147969,-617569134,81320701,863748409,-919166554,-1970747486,445643511,710026425,-181005127,-213130974,1956946412,1492013909,1826512355,-2105827316,523288816,-1111668581,1824149064,1024158661,1001120265,1923003339,-786981431,1590467677,-333029458,726465053,699398884,-806790645,-1184166013,66295197,-295499268,1463795183,863972700,-2057047381,1110966631,158362957,-752966018,1692155838,-921893188,245319338,1035608104,1627742175,-843347480,-531405426,2115009499,-100015084,-2139840997,521369747,-539064544,2130573095,1722408706,-1108385500,803388418,-1733441289,237702497,-6377517,-782518000,-997905514,-37644435,1370282850,-924066643,-1722830588,1644845132,-1511749974,1750335903,-907329824,-1705857248,1681151502,1458703124,-533909208,895170377,2065660591,1172518707,-131418202,643308505,-1493373980,-1681262016,489770837,1593682877,926242418,-1450459519,1732849755,-523188337,-1660551559,2061753788,1970991198,1698320325,-1936114542,-1595595403,1759707054,1132391858,-1015295240,-484105823,-1593279422,-639808913,-1434989754,113610618,-453779001,1564005901,-1327503669,1942936993,-12331035,-126937747,1505661137,620458664,-1021343600,-1519792470,1217470633,-148575861,-1446200238,-525757188,26526445,1575850841,1560280124,1266479422,576485294,1855664964,772759503,-1026128434,1508493746,904162356,-140398634,263647579,605545098,449448886,-917156041,-1506284755,-2132481356,-1523595359,-1918878674,1833567014,-1219649820,2138552474,-1089162105,1049046178,-1450837410,-1468724418,-1642637578,-1294164635,1541666473,1984919094,1453567641,488693268,2082358811,-494294907,130204796,-990300454,-568749485,417157275,48948779,-1564539607,390122958,1048615867,-66510160,-1381262318,2043012211,1871276488,-153356878,760234272,306406904,307055389,-1258889542,341883522,-440348261,-1549992673,114900799,847667161,-1704425088,463605430,1328374003,1960440150,-895300125,2089955761,-1863613097,-279097303,1750571650,1667755326,-138967051,990103121,1806188535,1140114285,334205325,-1261202934,-546041948,422184742,-1697514987,-1996757100,614203178,-138769674,-743228838,1679811691,-1441793455,254858288,671045179,-428992386,820612312,-242456505,-1580663059,407146347,804239436,726791773,1025341010,-143932311,-1770727633,1169720410,735402484,-1518977925,-184846945,369717380,622155826,258051011,-1227594181,-1540281467,-1879307037,-2144951744,545136982,1445672217,-407180702,562906801,-2034842888,652249405,1585454765,-1158736128,-264782843,636327579,-614585361,1701247518,-567369993,-1894143661,405306020,-117618432,1139953261,-151872749,-265788947,1236038981,-152546921,1999858989,1699351161,-970180144,-1083201614,-545193851,-725021036,-1138968981,604394499,-1844141047,838194731,668741540,666499503,41438271,-818902182,1088644546,-1678350777,-1269723558,1563153987,1187588157,-1873545175,1165677212,1939119,2038698291,-1359363703,1310892376,-406780444,2071389330,1982292531,-1986905128,2026873566,-1847105229,-1814707303,-1543663503,-2146189290,-1877075195,-603760838,370589244,-1380615924,820122963,828491265,1728124676,-377236740,1818732488,-998730612,-39720895,682951961,753835541,-954741027,-730769330,-1554827940,1676699676,1951445459,909507117,29324795,-534132841,306553142,-1078939150,597261002,1008198619,-1754371879,309956718,-1570258441,-2094478369,-1456882960,-649393277,1129828549,636549331,-1320861956,-1684855435,563086424,1886032558,1826779703,-599922545,15775808,-1078438797,-645455536,346869399,-1349363180,776343024,-1783627687,368691747,1798595940,1273351346,-338564773,-318193683,1851719173,-1716715305,-804606249,-1128037771,-1082112598,-1206772619,-822917047,-589993818,-213988205,491124605,1784443916,1411608722,1574070666,-96670418,-2118093004,1974079062,1670924588,94102208,-1466900920,-1712130101,190213985,1389292778,-270702585,1900913862,1924250016,-208513148,-1426351682,1733649181,1652887921,-378073830,-822238539,319829741,1783749380,-323601547,1706951350,-1557613700,213785103,-186061803,1067174876,873825876,-1880106327,963618344,-379271715,248107854,648143922,-2055656025,-1292767094,1254933312,-1041862970,1065062506,-1279663873,1426802102,1612185585,-1754967578,-324280197,-1044381827,-291266669,-646789633,-770141394,-1381038166,1250086576,1599824799,633437410,-100676008,-1058780070,829852118,1403671414,-1292654197,296478972,963512544,2091919137,2097810391,-1152361188,-456285269,1077161635,-382920936,-1190733412,1808820733,-70009888,2107233566,-545874616,-2081190311,420240440,-1682061818,-91590569,1576762884,-140622412,-596286887,-2016876223,-837270663,1392649517,1605621270,354923622,1839927843,172978082,2127952036,1290087958,1160257564,-2003389515,-742239357,1515709767,2108688809,2078039049,-2011041063,-1479263,-801581994,714263022,533498067,-986501067,175071337,-823861254,1055705417,1395960177,1607858852,-257236789,-1296596624,-797225679,-1513545046,1684013293,738020861,1878870695,147180107,1407894363,-649693736,1957380594,-1089097052,1810693511,-1570778305,2147307112,905628204,1543131413,338645074,-1079775864,-1124336111,-1331627327,71288924,2075462,1952338354,-1410558369,623438619,1710261067,555217301,-926567129,-112156800,1974226341,-1484962184,-261295136,1001713376,-1185837438,547709108,548855025,569843058,1937432749,-1511903626,-1220482079,-1749175057,1020057711,65235948,-341312314,-1456171061,1481476355,1298205232,-820459749,1697538589,912623653,-1704369876,830075283,133754531,-1086900949,-511143494,-153069863,-2127226445,1574356600,1561725357,1357149042,-654741541,-235355623,734450557,402426319,-1077152957,643883954,-232155562,-1996298537,1507641438,-1931945729,343177664,-117706333,884221638,305683887,2118502346,-1608193118,-1185645412,-942054485,-1219007945,1447276011,997458045,-428014869,661611638,2103720377,315496500,-750326879,-1722812218,456449985,-1605959611,-1457159579,1830153510,-1476956545,-270021043,341143474,1794250335,-557347418,1936619803,-59067555,-2026032099,-21761687,-908338570,1478064299,1419908827,-922640032,-411912669,1340490617,-884285547,-1491770794,-548180191,-1728530051,-1977173130,1007361544,-696940353,-1883384171,267585852,1522987529,-1360777323,-1156581443,984690878,332135510,-409270105,701377726,1846574781,400641388,763199247,957107150,-1834021982,71976357,1737775747,-577860818,-735262530,1963822994,729980566,1740836953,263843123,-349417192,1405553583,-820821659,1607707883,-542193752,1911599103,-625599651,1955093243,242904188,1929195029,1700951632,-266590162,1647330322,415981312,-1131870535,2070859175,1581140550,-814708991,-41041890,-1453537346,279682292,-1721855682,2106823278,-1989834418,-1521541023,1087630894,1464111716,1700784705,-795987283,-2000077591,-412885993,417724286,353450732,840590739,-95195123,1248303524,1381460173,1346783195,1204106910,-310628427,1822768051,-1544776496,1676148246,-120671679,-1521829460,1142265998,706951275,-260287720,-1418494905,224694924,8426167,-1122414262,188676823,2003330013,2081284979,-228119199,1009451565,-436295055,-903987377,708829680,1528487519,-297460446,618131997,-57773701,-699988441,1830598535,1278533664,-290048640,-1078278525,-920687336,1274568204,-1151078610,-410143592,2093297182,1165342587,671458188,1105832803,784295285,-777965268,1346897928,-652239122,-145994814,-283540622,829338095,-518623015,1170749782,1191019101,-101778068,378243843,1433028244,-1419593071,1650674408,645316538,-1795387238,-400114340,-1168622674,-152006666,1125977064,-1294950490,-1463616464,1201963799,-564939946,-376918617,739629796,562275087,905003781,-1565522064,1153707486,-876647638,1384091981,924167364,912756089,-1409044245,-810674281,1763529388,-189783997,863206524,967119988,-588424458,-1574563959,-1178366034,-566804902,-641229016,1028024421,929472780,1957282815,-1746158101,1181136289,768526370,7177732,1281854253,-1350428535,829964591,230537419,-131619246,-1367967671,720731853,558790567,-1858528136,-1657256140,317960919,-705785775,163653975,-1217272667,823267120,1743158130,1941527230,-1469368701,1940676022,1179987855];
var bloom = new BloomFilter(bloomSerialized, 3);

