module.exports = {
    title: 'Social Playlist',
    description: 'Springboot & Angular Hands-on Workshop',
    base: '/social-playlist/',
    themeConfig: {
        sidebar: [
            {
                title: 'Guide',
                collapsable: false,
                children: [
                    '/',
                    'backend/first-spring-boot-application',
                    'backend/spotify',
                    'frontend/first-angular-application',
                    'frontend/consuming-the-rest-api',
                    'automatic-login-on-first-page-visit'
                ]
            }
        ]
    },
    markdown: {
        lineNumbers: false,
        config: md => {
            md.use(require('markdown-it-footnote'))
        }
    }
}
