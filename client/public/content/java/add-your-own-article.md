---
title: 示例文章：如何给本网站添加你自己的内容
category: java
level: beginner
readMinutes: 6
tags: 教程, 入门, 内容管理
summary: 一篇用来演示的示例文章——你正在看的这篇，就是按照文末说明新建出来的。
order: 99
---

# 示例文章：如何给本网站添加你自己的内容

> 你正在读的这篇，就是一篇**示例文章**。它本身就是「新增内容」这个功能的最好演示。

## 这篇文章是怎么来的？

它只是一个普通的 Markdown 文件，路径是：

```
client/public/content/java/add-your-own-article.md
```

文件顶部是一段 **frontmatter**（用 `---` 包裹的元数据），用来告诉网站这篇文章的标题、分类、标签等信息：

```yaml
---
title: 示例文章：如何给本网站添加你自己的内容
category: java        # 必须是 categories.json 里的 id
level: 初级
readMinutes: 6
tags: [教程, 入门, 内容管理]
summary: 一句话摘要
order: 99
---
```

紧接着 `---` 之后，就是正文，用 Markdown 自由书写。

## 三步添加你自己的文章

1. 在 `client/public/content/<分类>/` 下新建一个 `.md` 文件（分类目前有 `java` / `python` / `frontend` / `ai`）。
2. 文件顶部写 frontmatter（至少包含 `title` 和 `category`），下面写正文。
3. 运行 `npm run gen` 重新生成清单，刷新页面即可看到。

## Markdown 能写什么

支持标题、**加粗**、*斜体*、`行内代码`，以及代码块（带语法高亮）：

```java
public class Hello {
    public static void main(String[] args) {
        for (int i = 0; i < 3; i++) {
            System.out.println("Hello " + i);
        }
    }
}
```

也支持表格：

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| title | 是 | 文章标题 |
| category | 是 | 分类 id |
| order | 否 | 同分类内排序，越小越靠前 |

还有列表、引用、链接等常用语法，照常书写即可。

> 提示：想新增一个**分类**，编辑 `client/public/content/categories.json` 增加一项即可。
> 想加**面试题**，把文件放进 `client/public/content/interviews/` 目录，并把 frontmatter 里的 `title` 换成 `question:` 字段。

就这么简单——内容即文件，仓库即网站。
