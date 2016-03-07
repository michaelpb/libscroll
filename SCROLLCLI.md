## WIP

Continuation of [DEVELOPMENT.md], only for eventual CLI interface.

# ScrollObject interactions

The Scroll CLI interface revolves around ScrollObjects (e.g. files) within a
workspace.

They all generally follow the following structure:

```
scroll path/to/file action
```

"Action" in this case is a specially exposed method on the given ScrollObject.
For concrete examples:

```
scroll image.png resize 100x100
scroll some/long/path/to/document.md render
```

Since this can get wordy, such as if there are long paths, there is also a
shortcut convention, as follows:

```
scroll --document render
scroll --image=image.png render 100x100
```

The top one would simply take the first document. If there are more than one,
it would exit 1, and list the possibilities.

Programmaticly, the following logic is applied:

1. Walk upward from either the path given, or the current working directory,
   until we get to a Scroll Workspace
2. Resolve `path/to/file` (or `--shortcut=naming`) into absolute path
3. Load that Scroll Workspace
4. Scan the objects in that Scroll Workspace for one that matches the filepath
5. Look on that ScrollObject for an `actions` property
6. Execute given action

For a concrete example, `scroll image.png resize 100x100; echo done` would correspond with
the following:

```javascript
Workspace.load(basedir('image.png'), workspace => {
    const image = workspace.objects.find('image.png');
    image.actions.render('100x100', () => {
        console.log('done');
    });
});
```

There are some actions which are universal, including `copy`, and others which
are common among all cfg-based objects, including `inherit`.

There is one more thing: the stash. The stash lives in a well known location
(`~/.config/scroll/stash/`) and can be referenced also, as follows:

```
scroll --stash-image=chapter_header.png copy
scroll --stash-tag=base_paragraph inherit
```

In this case, the `stash` prefix causes it to load the stash as though it were
a workspace.

Inherit does the following:

```
[inherit]
stash-tag=base_paragraph
```


## Git
```
scroll .git pull
scroll .git push
scroll .git commit
scroll .git undo
scroll .git redo
scroll .git purge
```

* pull:   clones or updates a git-controlled scroll into your home
* push:   pushes a git-controlled scroll back to a source
* commit: auto-generates a commit for a git-controlled scroll (possibly branching)
* undo:   undos the last commit in a git-controlled scroll
* redo:   redos the last commit in a git-controlled scroll
* purge:  deletes ALL history in a git-controlleds scroll

## Document

```
scroll document.md render

# Shortcut convention:
scroll --document render
scroll --document=document render
```

* render: render to particular target (e.g. render HTML, no packaging

## Export

```
scroll publish/basic.cfg export

# Shortcut convention:
scroll --publish export
scroll --publish=basic export
```

* exports: full export to particular target, e.g. "publish"

## Image

(Example)

```
scroll image/image.png resize 200x200
```

* resize: resizes image to new dimensions


## Config

```
scroll ~/.conf/config init

# Shortcut convention:
scroll --conf init
```

## Stash

```
scroll ~/.conf/config/stash list
scroll ~/.conf/config/stash load ~/.conf/config/stash/tags/base_chapter.cfg
scroll ~/.conf/config/stash save ./tags/custom_thing.cfg

# Shortcut convention:
scroll --stash list
scroll --stash load --tag base_chapter
scroll --stash save --tag custom_thing

# Or better yet:
scroll --stash-tag=base_chapter load --copy
scroll --stash-tag=base_chapter load
```
So, `stash` is nothing special, just another workspace, with a well-known
location, and can be searched through with `--stash-TYPE`.

## Template

```
scroll ~/.conf/config/stash/templates/document new

# Shortcut convention:
scroll --stash-template=document new
```

# Global commands

```
scroll --core-config load --copy ~/.config/
```

(maybe --core-XYZ refers to core package?)

Initializes blank config file.

