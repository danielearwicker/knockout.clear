/*global module:false*/
module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        build: {
            main: {}
        },
        test: {
            node: 'spec/runner.node.js'
        }
    });

    grunt.registerTask('clean', 'Clean up output files.', function (target) {
        if (grunt.file.exists('build')) {
            grunt.file.delete('build');
        }
        return !this.errorCount;
    });

    grunt.registerMultiTask('build', 'Build', function() {
        if (!this.errorCount) {
            grunt.file.mkdir('build/output');
            grunt.file.copy('lib/knockout.clear.js',
                            'build/output/knockout.clear.js');
            grunt.file.copy('bower_components/knockout/dist/knockout.js',
                            'build/output/knockout-latest.js');
        }
        return !this.errorCount;
    });

    grunt.registerMultiTask('test', 'Run tests', function () {
        var done = this.async();
        grunt.util.spawn({ cmd: this.target, args: [this.data] },
            function (error, result, code) {
                if (code === 127 /*not found*/) {
                    grunt.verbose.error(result.stderr);
                    // ignore this error
                    done(true);
                } else {
                    grunt.log.writeln(result.stdout);
                    if (error)
                        grunt.log.error(result.stderr);
                    done(!error);
                }
            }
        );
    });

    // Default task.
    grunt.registerTask('default', ['clean', 'build', 'test']);
};
