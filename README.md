# mongoose-athena

![Publish](https://github.com/salo-creative/mongoose-athena/workflows/Publish/badge.svg)
![Development](https://github.com/salo-creative/mongoose-athena/workflows/Development/badge.svg)

A plugin to add weighted search and pagination to your schema.

## Usage

Install

```
yarn add @salo/mongoose-athena
```

Add Athena to your schema:

```javascript
const athena = require('@salo/mongoose-athena');

MySchema.plugin(athena, {
  fields: [{
    name: 'name',
    prefixOnly: true,
    threshold: 0.3,
    weight: 2
  }, {
    name: 'biography',
    minSize: 4
  }]
});

```

Then, to use it with weighting you can do:

```javascript
MySchema.athena({
  query: { /* something to filter the collection */ },
  term: 'Athena',
  sort: 'relevancy', // this is the key to trigger weighting
  page: 1,
  limit: 20
});
```

This will search `name` and `biography` for the term 'athena'. If it is sorted by 'relevancy' then a `confidenceScore` will be attached to the result. The result looks like so:

```javascript
{
  docs: [], // matching records in the collection
  pagination: {
    page: Number,
    hasPrevPage: Boolean,
    hasNextPage: Boolean,
    nextPage: Number || null,
    prevPage: Number || null,
    total: Number
  }
}
```

Or you can use it simply to paginate:

```javascript
MySchema.athena({
  query: { /* something to filter the collection */ },
  term: 'Athena',
  sort: '-created_at', // this will not add `confidenceScore` to the results
  page: 1,
  limit: 20
});
```

## API

### Field options

| Field      | Description                                                                                                                                   | Type    | Default |
|------------|-----------------------------------------------------------------------------------------------------------------------------------------------|---------|---------|
| name       | The field name in your collection                                                                                                             | String  |         |
| prefixOnly | Whether to only match from the start of the string or anywhere in the string e\.g\. 'ob' would match 'bob' with this off but not when it's on | Boolean | false   |
| threshold  | Value between 0 and 1\. It will only count a score if it is greater or equal to this value                                                    | Float   | 0       |
| minSize    | The length of the string to start matching against\. e\.g\. if minSize is 4 then the term 'bob' will not search against the field             | Int     | 2        |
| weight     | A scaling value to multiply scores by so you can weigh certain fields higher/lower than others                                                | Int     | 1       |


### Response

| Field                   | Description                             | Type          |
|-------------------------|-----------------------------------------|---------------|
| docs                    | Array of matching documents             | Array         |
| pagination\.page        | The current page                        | Int           |
| pagination\.hasPrevPage | Whether or not there is a previous page | Boolean       |
| pagination\.hasNextPage | Whether or not there is a next page     | Boolean       |
| pagination\.nextPage    | Value of the next page or null          | Int \|\| null |
| pagination\.prevPage    | Value of the previous page or null      | Int \|\| null |
| pagination\.total       | Total number of matching documents      | Int           |


## How it works

The crux of it lies in the `calculateScore` method in the helpers directory. This uses the [Jaro-Winkler distance](https://yomguithereal.github.io/talisman/metrics/distance#jaro-winkler) to compute how close your search term is (e.g. 'Athena') to the text in your database. Additionally text is ranked higher if it appears at the start rather than the end of a string so 'Athena Rogers' will have a higher `confidenceScore` than 'Rogers Athena'.

One thing to note is that the search term is not split on spaces but text on the database is. So using our previous example where `term = 'Athena Rogers'` the text in the database is split into `['Athena', 'Rogers']`. Now, `Athena Rogers` doesn't directly match 'Athena' or 'Rogers' (it scores 0.93 and 0.41 respectively) but this score is accumulated (0.93+0.41) and then multiplied by the position in the string and any weighting applied to the field. We could split the search term to get direct matches and higher scores but this would considerably slow the calculation of the score down by an order of magnitude as every part of the search term would need matching to every part of the field. In my testing the current approach lends itself to speed and logical weighting.

## Pagination

The pagination is based on [mongoose-paginate-v2](https://github.com/aravindnc/mongoose-paginate-v2/) and [mongoose-aggregate-paginate-v2](https://github.com/aravindnc/mongoose-aggregate-paginate-v2). Athena's implementation is an amalgamation of both libraries and it transparently determines if the query is an aggregate or not.

```javascript
const aggregate = MySchema.aggregate();
const result = await MySchema.athena({
  query: fullNameQuery,
  limit: 10
});
```

## Publishing

1. Create a feature branch from master
2. Open a PR from your feature back to master. This can be repeated multiple times between release
3. For each change update the draft release on github to maintain an accurate changelog 
4. When you are ready to release the library checkout master increment the package.json and push back to origin
5. On github publish the draft release, ensuring the tag matches the package.json version number. When you publish the tag the CI should kick in and automatically publish for you

## Testing

Athena currently has 100% test coverage.

## Roadmap

* Make options (e.g. `weighting`, `minSize`) configurable outside of the schema definition.
* Add more robust tests to ensure there aren't regressions in options going to `pagination` (e.g. `select`, `sort`, etc.).

## Prior art (and disclaimer)

I'm not an expert in any of these fields and have very much relied on a few prior projects to reach this point. There's a very high chance there are more efficient ways to accomplish this and I welcome PRs to help this!

That said, many thanks to: 

* [Mongoose Paginate v2](https://github.com/aravindnc/mongoose-paginate-v2/) for the pagination logic
* [Fuzzy Scoring Regex Mayhem](https://j11y.io/javascript/fuzzy-scoring-regex-mayhem/) for the guidance on how to weigh results (note this library does not currently support fuzzy searching)
* [Efficient Techniques for Fuzzy and Partial matching in mongoDB](http://ilearnasigoalong.blogspot.com/2013/10/efficient-techniques-for-fuzzy-and.html) for an approach to different fuzzy matching techniques and showing me it's harder than it seems at first!
* [Mongoose Fuzzy Searching](https://github.com/VassilisPallas/mongoose-fuzzy-searching) for the inspiration for the API