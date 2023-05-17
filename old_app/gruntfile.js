module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-sass');
    var pkg = grunt.file.readJSON('./package.json');


    // Project configuration.
    grunt.initConfig({
        copy: {
            ui: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**'],
                    dest: 'dist/'
                }]
            },
            release_bower: {
                files: [{
                    expand: true,
                    cwd: 'bower_components/',
                    src: ['**'],
                    dest: 'release/plan/bower_components/'
                }]
            },
            release_dist: {
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**'],
                    dest: 'release/plan/'
                }]
            }
        },
        clean: {
            prebuild: {
                src: ['dist/']
            },
            postbuild: {
                src: ['src/css/*.css','src/css/*.map']
            },
            postrelease: {
                src: ['release/plan/']
            }
        },
        sass: {
            options: {
                sourceMap: true
            },
            dist: {
                files: {
                    'src/css/main.css': 'src/css/main.scss'
                }
            }
        },
        compress: {
            main: {
                options: {
                    archive: 'release/super-poker-' + pkg.version + '.zip'
                },
                files: [
                    {expand: true, cwd: 'release/', src: ['plan/**']}
                ]
            }
        }
    });



    // Default task(s).
    grunt.registerTask('default', ['build']);
    grunt.registerTask('build', ['clean:prebuild', 'sass', 'copy:ui', 'clean:postbuild']);
    grunt.registerTask('release', ['clean:prebuild', 'sass', 'copy:ui', 'copy:release_bower', 'copy:release_dist', 'compress:main', 'clean:postbuild', 'clean:postrelease']);


};