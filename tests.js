
function tests() {
    var o = document.getElementById('output');
    function xtest(message, fn) {}
    function test(message, fn) {
        function log(passfail, test, message) {
            var color = passfail === 'pass' ? 'green' : 'red';
            o.innerHTML += `<h3>${test}</h3><pre style="color:${color}">${message}</pre>`;
        }
        function eq(a, b) {
            return JSON.stringify(a) == JSON.stringify(b);
        }
        function expect(a, b) {
            if (eq(a, b)) {
                log('pass', message, `passed: ${JSON.stringify(a)}`);
            } else {
                log('fail', message, `expected: ${JSON.stringify(a)} \nactual:   ${JSON.stringify(b)}`);
            }
        }
        fn(expect);
    }
    function group(name, fn) {
        o.innerHTML += `<h1>${name}</h1>`;
        fn();
    }
    group('toBusyBlocks', function() {
        test('overlapping', (expect) => {
            expect(
                [["7:30am", "3:45pm"], ["4:00pm", "6:00pm"]],
                toBusyBlocks([["7:30am","3:45pm"],["8:30am","12pm"],["8:30am","9:30am"],["4pm","5:15pm"],["5pm","6pm"]]),
            );
        })
    })
    
    group('consolidate', function() {
        test('not overlapping', (expect) => {
            expect(
                [[1, 2], [3, 4]],
                consolidate([[1, 2], [3, 4]]),
            )
        });
        
        test('adjacent', (expect) => {
            expect(
                [[1, 4]],
                consolidate([[1, 2], [2, 4]]),
            )
        });
        
        test('within tolerance', (expect) => {
            expect(
                [[1, 4]],
                consolidate([[1, 2], [3, 4]], 2),
            )
        });
        
        test('multiple overlaps', (expect) => {
            expect(
                [[1, 11], [13, 15]],
                consolidate([[1, 10], [2, 3], [13, 14], [3, 4], [10, 11], [14, 15]]),
            )
        });        
    });
    
}

tests();

window.setTimeout(function() {
    window.location = window.location;
}, 1000);
