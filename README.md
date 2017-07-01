# remark-lint-no-dead-links

🚧🚧 **EXPERIMENTAL! WORK IN PROGRESS! 🚧🚧

[remark-lint](https://github.com/wooorm/remark-lint) plugin to ensure that external links in your Markdown are alive.

Uses [link-check](https://github.com/tcort/link-check) to validate links.

Options: `string`.

If a string is provided, it is used as a base URL against which relative URLs are checked.
See examples below.

## Example

When this rule is turned on, the following `valid.md` is ok:

```md
Here is a [good link](https://www.github.com/wooorm/remark)
```

When this rule is turned on, the following `invalid.md` is **not** ok:

```md
Here is a [bad link](https://www.github.com/wooom/remark-dead-link)
```

```
1:11-1:68: Link to https://www.github.com/wooom/remark-dead-link is dead
```

**By default, relative links are ignored.**
To check relative links, you must provide a base URL string as an option.

When nothing is passed, the following `valid.md` is ok:

```md
Here is a [good relative link](wooorm/remark)

Here is a [bad relative link](wooorm/remark-dead-link)
```

When `https://www.github.com` is passed in, the following `valid.md` is ok:

```md
Here is a [good relative link](wooorm/remark)
```

But the following `invalid.md` is **not** ok:

```md
Here is a [bad relative link](wooorm/remark-dead-link)
```
