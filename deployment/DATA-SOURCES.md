# Public demo reference data

The JSON file is a public reference snapshot, not build output or a user database. Records retain source URLs and timestamps. It contains 42 works and 43 Paris event records from the sources below. Interface filters may hide past or closed events.

- [Open Library](https://openlibrary.org/developers/licensing): book and edition metadata released for reuse under CC0. No book text is included.
- [Wikidata](https://www.wikidata.org/wiki/Wikidata:Data_access): multilingual structured metadata under CC0. IMDb, Douban and Letterboxd identifiers are external links, not imports from those sites.
- [Paris Open Data: Que faire à Paris](https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/): Paris event information under the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/). The event subset in this snapshot is made available under the same ODbL. It is filtered for mystery-related keywords and Paris postcodes; event descriptions and sessions should be checked with organizers.

IMDb downloadable dataset records are excluded. Local data and background jobs remain separate from the static demo. Meetup is an external search link, not an automated import. No user ratings, reviews, private notes or registration data are included.

Maps use Leaflet and OpenStreetMap tiles with visible attribution. The site does not request user geolocation.

Introductions now include short extracts from Open Library and Wikipedia opening sections. Wikipedia text retains language, page attribution and CC BY-SA 4.0 licensing. The three introductions for Never Lie are paraphrased from its linked Open Library record. Book covers are displayed directly from the Open Library Covers API as requested by its public-use guidelines; cover image rights remain separate from CC0 catalog metadata. Wikimedia images are used only when their attribution and open license are available. Missing artwork is not replaced with invented covers.
