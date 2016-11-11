#!/usr/bin/env node
var program = require('commander');
var co = require('co');
var prompt = require('co-prompt');
var wilddog = require('wilddog')
var main = function () {
    program
        .version('0.0.1')
        .option('--token <token>')

        .command('set [appid] [path] [data]')
        .description('set data to the target path')
        .action(function (appid, path, data, options) {

        })
    program
        .command('update [appid] [path] [data]')
        .description('merge data to the target path')
        .action(function (appid, path, data, options) {
            console.log(appid)
            console.log(path)
            console.log(options)
        })
    program
        .command('push [appid] [path] [data]')
        .description('add one child with an automate generated key')
        .action(function (appid, path, data, options) {
            console.log(appid)
            console.log(path)
            console.log(data)
        })
    program
        .command('remove [appid] [path]')
        .description('remove data')
        .action(function (appid, path, options) {
            console.log(appid)
            console.log(path)
            console.log(data)
        })
    program
        .command('query [appid] [path]')
        .option('-o --one', 'once')
        .option('-e --event <event>', 'event type,the value can be one of :value, child_added, child_changed, child_moved,child_removed')
        .option('--orderByChild <child>', 'orderByChild')
        .option('--orderByValue', 'orderByValue')
        .option('--orderByPriority', 'orderByPriority')
        .option('--startAt <start>', 'start Position')
        .option('--endAt <end>', 'end Position')
        .option('--equalTo <eq>', 'equal to a value')
        .option('--limitToFirst <number>', 'limit to first')
        .option('--limitToLast <number>', 'limit to last')

        .action(function (appid, path, options) {

            var token = options.token
            query(appid, token, path, options, function (err, snapshot) {
                if (err) {
                    console.error(err)
                    process.exit(0)
                }
                showSnapshot(snapshot)
            })
        })


    program.on('--help', function () {
        console.log('wilddog doc: https://docs.wilddog.com');
        console.log('github: https://github.com/stackOverMind/wilddog-cli');
        console.log('');
    });
    program.parse(process.argv);
    if (!process.argv.slice(2).length) {
        console.log('wilddog --help for more information')
        process.exit(0)
    }
}


var initApp = function (appid, token, cb) {
    var app = wilddog.initializeApp({
        "syncURL": "https://" + appid + '.wilddogio.com',
        "authDomain": appid + '.wilddog.com'
    })
    if (token != null) {
        app.auth().signInWithCustomToken(token, function (err, user) {
            if (err) {
                cb(err)
            }
            else {
                cb(null, app)
            }
        })
    }
    else {
        cb(null, app)
    }
}

var query = function (appid, token, path, options, cb) {
    initApp(appid, token, function (err, app) {
        if (err) {
            cb(err)
        }
        else {
            var ref = app.sync().ref(path);
            ref = parseOrder(ref, options)
            ref = parsePosition(ref, options)
            ref = parseLimit(ref, options)
            var event = parseEventType(options)
            if (options.one) {
                ref = ref.once(event, function (snapshot) {
                    cb(null, snapshot)
                    process.exit(0)
                })
            }
            else {
                ref = ref.on(event, function (snapshot) {
                    cb(null, snapshot)
                })
            }

        }
    })
}
var showSnapshot = function (snapshot) {
    var key = snapshot.key();
    var value = snapshot.val();
    console.log(JSON.stringify(value, null, 2))
}
/**以乐观的方式解析 */
var tryParse = function (str) {
    var res = str;
    try {
        res = JSON.parse(str)
    } catch (e) {
    }
    return res;
}
var parseOrder = function (ref, options) {

    if (options.orderByChild != null) {
        console.log(options.orderByChild)

        ref = ref.orderByChild(options.orderByChild)
    }
    else if (options.orderByKey) {
        ref = ref.orderByKey()
    }
    else if (options.orderByValue) {
        ref = ref.orderByValue()
    }
    return ref
}
var parsePosition = function (ref, options) {
    if (options.startAt) {
        ref = ref.startAt(tryParse(options.startAt))
    }
    else if (options.endAt) {
        ref = ref.endAt(tryParse(options.endAt))
    }
    else if (options.equalTo) {
        ref = ref.equalTo(tryParse(options.equalTo))
    }
    return ref
}
var parseLimit = function (ref, options) {
    if (options.limitToFirst) {
        ref = ref.limitToFirst(tryParse(options.limitToFirst))
    }
    else if (options.limitToLast) {
        ref = ref.limitToLast(tryParse(options.limitToLast))
    }
    return ref
}
var parseEventType = function (options) {
    var e = 'value'
    if (options.event) {
        if (['value', 'child_added', 'child_changed', 'child_removed', 'child_moved'].indexOf(options.event) >= 0) {
            e = options.event
        }
    }
    return e;
}
main()