AUTHOR = 'Rahul Chavda'
SITENAME = 'Rahul Chavda'
SITE_AUTHOR = 'Rahul Chavda'
SITEURL = "rahul-chavda.github.io"
PATH = "content"

TIMEZONE = 'Asia/Kolkata'
DEFAULT_LANG = 'en'

RELATIVE_URLS = True
DEFAULT_DATE = 'fs'
DEFAULT_DATE_FORMAT = '%B %-d, %Y'
DEFAULT_PAGINATION = 10
SUMMARY_MAX_LENGTH = 42

ARTICLE_URL = '{date:%Y}/{date:%m}/{slug}/'
ARTICLE_SAVE_AS = ARTICLE_URL + 'index.html'

PAGE_URL = '{slug}/'
PAGE_SAVE_AS = PAGE_URL + 'index.html'

ARCHIVES_SAVE_AS = 'thoughts/index.html'
YEAR_ARCHIVE_SAVE_AS = '{date:%Y}/index.html'
MONTH_ARCHIVE_SAVE_AS = '{date:%Y}/{date:%m}/index.html'

TYPOGRIFY = True

MARKDOWN = {
    'extension_configs': {
        'markdown.extensions.admonition': {},
        'markdown.extensions.codehilite': {'linenums': None},
        'markdown.extensions.extra': {},
    },
    'output_format': 'html5',
}


THEME = 'pneumatic'
# Theme Configs
INDEX_DESCRIPTION = 'Website and blog of Rahul Chavda, a software engineer from Ahmedabad, India.'

ICONS_PATH = 'images/icons'

SOCIAL_ICONS = [
    ('https://github.com/rahul-chavda', 'GitHub', 'fa-brands fa-github'),
    ('https://instagram.com/this.rahul_chavda', 'Instagram', 'fa-brands fa-instagram'),
    ('/atom.xml', 'Atom Feed', 'fa-solid fa-feed'),
]

THEME_COLOR = '#FF8000'

CACHE_CONTENT = False
DELETE_OUTPUT_DIRECTORY = True
OUTPUT_PATH = 'develop'

templates = ['404.html']
TEMPLATE_PAGES = {page: page for page in templates}

STATIC_PATHS = ['images', 'files', 'extra']
IGNORE_FILES = ['.DS_Store', 'pneumatic.scss', 'pygments.css']

extras = ['CNAME', 'favicon.ico', 'keybase.txt', 'robots.txt']
EXTRA_PATH_METADATA = {'extra/%s' % file: {'path': file} for file in extras}

PLUGIN_PATHS = ['plugins']
PLUGINS = ['assets', 'neighbors', 'pelican-readtime']
ASSET_SOURCE_PATHS = ['static']
ASSET_CONFIG = [
    ('cache', False),
    ('manifest', False),
    ('url_expire', False),
    ('versions', False),
]

DIRECT_TEMPLATES = ['archives']
CATEGORY_SAVE_AS = ''