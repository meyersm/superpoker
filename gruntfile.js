module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-sass');


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
            }
        },
        clean: {
            prebuild: {
                src: ['dist/']
            },
            postbuild: {
                src: ['src/css/*.css','src/css/*.map']
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
        }
    });



    // Default task(s).
    grunt.registerTask('default', ['build']);
    grunt.registerTask('build', ['clean:prebuild', 'sass', 'copy:ui', 'clean:postbuild']);


};