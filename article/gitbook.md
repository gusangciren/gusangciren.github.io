你需要一个[Github.com](https://github.com) 或者[Gitee](https://gitee.com/)账号，在这里，我以`Github`为准，操作步骤和运行逻辑是差不多呢，gitee就是github的镜像网站。

那么，github是什么？干什么用的？为啥我必须得有一个它的账号呢？github是一个同性交友软件，跑偏了，GitHub是一个面向开源及私有软件项目的代码托管平台（别被吓到了，你不用会编程语言，用Markdown，一个超文本标记语言，下文讲），GitHub拥有1亿以上的开发人员，400万以上组织机构和3.3亿以上资料库。 因此，我还认为Github是一个社交软件以及一个超级的计算机相关学习的学习平台（会有很多有趣的项目），和下载软件的应用商店（很多软件都是开源的，非要下载带有广告的盗版软件）。因此，你必须有一个。

你在阅读我们教程，出现了任何的问题，回头细度此文章，，可以读一读Github的产品使用说明书 - [github简介](https://learn.microsoft.com/zh-cn/training/modules/introduction-to-github/?WT.mc_id=OSS-MVP-5003485) 。

找到一个"ChatGPT"，[讯飞星火](https://xinghuo.xfyun.cn)就很好，碰到任何不懂的问题，要么直接问AI，要么在Chrome里搜索，再解决不了，找我（怎么联系我，自己想办法）。在人工智能时代，好学的人是最幸福的，个性化教育成为可能，个性化老师的成本几乎为零，你可以带着你的“玻璃心”去学习，不用怕没面子。

你可以问：我是一个零基础初学者，我想要用Docsify搭建一个个人博客并在github上部署，请用详细的步骤教给我。

### 具体步骤
请按照以下步骤操作：
> 1. 打开 [github.com](https://github.com) --- `https://github.com` 网站，注册一个帐号（**建议把账户名直接设置成自己的名字。**），这并不难，几个英文单词而让你退回原点，那你没有那么渴望，放弃吧，别浪费时间了，放弃放下去。
> 2. 由于Github的服务器在境外，可能存在境内访问的困难（我的`https://gusangciren.github.io`是托管在 github），其原因在于境内可能存在的 DNS 污染，所以，可以通过修改系统 hosts 文件解决：

Mac 的 hosts 文件位置为： /etc/hosts
Windows 的 hosts 文件位置为：C:\Windows\System32\drivers\etc\hosts

在 hosts 文件中添加以下内容：

            192.30.253.112   github.com
            185.199.111.153  assets-cdn.github.com
            151.101.193.194  github.global.ssl.fastly.net
            Copy to clipboardErrorCopied

如此这般之后，理论上访问困难问题就可以解决了。

> 3. 你还可以选择[Gitee](https://gitee.com/) ，但我更推荐Github，小弟是不可能完全模仿的了大哥的样子。—— 无论如何你都必须有一个 github 账户 。


> 4. 

> 5.

> 6.
> 7.
> 8.
> 9.
> 10. 
如果设置了自己的名字，那么就是名字. github. io。然后在setting 设置里可以做一些操作，自己去看。

这就是你的网址。


> 4. 使用 `git clone` 命令或者使用 [Desktop for Github](https://desktop.github.com/) 将 [the craft of selfteaching](https://github.com/selfteaching/the-craft-of-selfteaching) 这个你 Fork 过来的仓库克隆到本地；
> 5. 按照 [Jupyterlab 的安装与配置](T-appendix.jupyter-installation-and-setup.md) 的说明在本地搭建好 Jupyterlab —— 如果在 Jupyterlab 中浏览本书的话，其中的所有代码都是可以 “当场执行” 的，并且，你还可以直接改着玩……
> 6. 在阅读过程中，可以不断通过修改文章中的代码作为练习 —— 这样做的结果就是已阅读过的文件会发生变化…… 每读完一章，甚至时时刻刻，你都可以通过 `git commit` 命令向你自己 Fork 过来的仓库提交变化 —— 这就是你的阅读工作证明；
> 7. 仓库里有一个目录，`my-notes`，你可以把你在学习过程中写的笔记放在那里；
> 8. 仓库里还有另外一个目录，`from-readers`；那是用来收集读者反馈的 —— 将来你可以写一篇《我的自学之路》，放在这个目录里，单独创建一个分支，而后提交 `pull request`，接受其他读者投票，若是达到一定的赞同率，那么你的文章就会被收录到主仓库中被更多人看到，激励更多的人像你一样走上自学之路……




 
**git**。
  
  








## 个人博客网站搭建与部署。


### 写什么？用什么写？
写什么？
自己想去。

用什么写？
用Markdown。

![](images/008_Image_1.jpg)










当然，为了这么做，你还要多学一样反正你早晚都必须学会的东西，Git —— 请参阅附录《[Git 入门](T-appendix.git-introduction.md)》。

时间就是这样，我们没办法糊弄它。而有了 git 这样的工具之后，我们在什么时候做了什么样的工作，是很容易证明的 —— 这对我们来说真是天大的好事。

github 上写本书。

### 如何使用 Pull Request 为这本书校对

另外，在你阅读的过程中，发现有错别字啊、代码错误啊，甚至有 “更好的表述” 等等，都可以通过 `pull request` 来帮我改进 —— 这也是一种 “工作证明”。

(1) 使用浏览器访问 https://github.com/selfteaching/the-craft-of-selfteaching

(2) 点击右上角的 “Fork 按钮”，将该仓库 Fork 到你的 Github 账户中

![](images/github-fork.png?raw=true)

(3) 创建一个新分支，可以取名为 `from-<your_username>`，比如，`by git.basic.tutorial`；之后点击 Create Branch 建立新分支。

![](images/github-new-branch.png?raw=true)

(4) 在新分支下进行修改某个文件，而后提交 —— 提交前不要嫌麻烦，一定要在 Comment 中写清楚修改说明：

![](images/github-commit.png?raw=true)

以上示例图片中是修改了 README.md 文件 —— 事实上，你应该提交的是的确有必要的校对。

另外，**请注意**：在创建分支之前，要将你的 Fork 更新到最新版。具体操作方法见下一节《如何在 Github 网站上将自己的 Fork 与原仓库同步》。

(5) 在页面顶部选择 Pull request 标签：

![](images/github-pull-request.png?raw=true)

而后点击 `Compare & pull request` 按钮 —— 如果看不到这个按钮，那就点击下面刚刚修改文件的链接，如上图中的 “Update README.md”（这是你刚刚提交修改时所填写的标题）。

![](images/github-open-pull-request.png?raw=true)

确认无误之后，点击 `Create pull request` 按钮。

![](images/github-create-pull-request.png?raw=true)

(6) 随后，Github 用户 [@xiaolai](https://github.com/xiaolai) —— 就是我，即，the-craft-of-selfteaching 这个仓库的所有者，会被通知有人提交了 Pull request，我会看到：

![](images/github-confirm-merge.png?raw=true)

在我确认这个 Pull request 修改是正确的、可接受的之后，我就会按 `Merge pull request` 按钮 —— 如此这般，一个修正就由你我共同完成了。

![](images/github-merged-pull-request.png?raw=true)

**注意**

提交 Pull request 的时候，最佳策略如下：

> * 提交 Pull request 之前，必须先将你的 Fork 的 master 与原仓库同步到最新；
> * 从 master 创建 **新的 branch** 进行增补、修改等操作；
> * 尽量每次只提交一个小修改；
> * 提交时尽量简短且清楚地说明修改原因；
> * 耐心等待回复。

当自己的 Fork 过来的仓库已经被你在本地 “玩残” 了的时候，它千万不能被当作用来提交 Pull request 的版本。自己本地怎么玩都无所谓，但需要向别人提交 Pull request 的时候，必须重新弄一个当前最新版本到本地，而后再在其基础上修改。

### 如何在 Github 网站上将自己的 Fork 与原仓库同步

(1) 在你的 Fork 页面中如下图所示，点击 `Compare` 链接：

![](images/sync-fork-1.png?raw=true)

(2) 将 `base repository` 更改成当前自己的 Fork，在图示中即为 `gitbasictutorial/the-craft-of-selfteaching`：

![](images/sync-fork-2.png?raw=true)

(3) 这时候，页面会显示 `There isn't anything to compare.`，因为你在比较 “自己” 和 “自己”。点击 `compare across forks` 链接：

![](images/sync-fork-3.png?raw=true)

(4) 将 `head repository` 更改成 Upstream Repository（即，上游仓库），在图示中即为 `selfteaching/the-craft-of-selfteaching`：

![](images/sync-fork-4.png?raw=true)

(5) 稍等片刻，你会看到比较结果；而后你可以创建一个 Pull request —— 这是一个由你自己向你自己的 Fork 仓库提交的 Pull request：

![](images/sync-fork-5.png?raw=true)

(6) 而后你在 `Pull requests` 标签页里会看到你刚刚提交的 Pull request：

![](images/sync-fork-6.png?raw=true)

(7) 同意并合并之后的结果是，你的 Fork 与上游仓库同步完成了：

![](images/sync-fork-7.png?raw=true)

当然，有时会出现一些你无法解决的问题，那么，还有一个最后的方法：

> 将你的 Fork 删除，而后重新到 https://github.com/selfteaching/the-craft-of-selfteaching 页面按一次 `Fork` 按钮……

### 如何使用 github 记录自己的学习过程

你可以在本地建立一个分支（branch），例如，取名为 `study`：

```bash
git branch study
git checkout study
```

如此这般之后，你在本地工作目录中所做的任何修改，都可以提交到 `study` 这个分支之中。

你每次在 Jupyterlab 中浏览 `ipynb` 文件，按 `^ + Enter` 执行 code cell 中的代码的时候，该文件都会发生一些变化；你也可以随意修改文件中的任何地方，比如，添加一个 code cell，将某段代码从头至尾 “敲” 一遍；也可以修改某个 code cell 中的代码看看执行结果有什么不同；还可以添加或者修改任何 markdown cell —— 就当自己做笔记了……

总而言之，当你阅读完某一章节并如上所说那样做了一些改动之后，那个 `ipynb` 文件就发生了一些变化。于是，你就可以执行以下命令：

```bash
git add .
git commit -am 'my study result'
git push
```

如此这般，在 `study` 这个分支中就记录着你的学习轨迹。

当然，如果在这过程中，你发现本书自身有需要校对的地方，那么，你需要切换到 `master` 分支，执行以下命令：

```bash
git checkout master
git pull
```

而后再修改，进而按照上一节的方法提交 Pull request。

未来，在 [https://github.com/selfteaching](https://github.com/selfteaching) 下我会专门设置一个 repo，用来自动扫描 github 上本书的学习记录 —— 这种记录在过往的书籍当中是不可能存在的，然而，现在却可以了。在我看来，将来这种记录的作用甚至有可能比 “学历” 还要重要。





# 第三章：使用 Git

在使用 Git 和 GitHub 时，你可能会想知道这两者之间的区别。

Git 是一种分布式版本控制系统 (DVCS)，多名开发人员或其他参与者可通过它共同处理同一项目。 它提供了一种方法来使用一个或多个本地分支并将它们推送到远程存储库。 Git 负责在本地计算机上发生的与 GitHub 相关的所有操作。 重要的 Git 功能包括：

已在本地计算机上安装和使用
处理版本控制
支持分支
若要详细了解 Git，请参阅使用 Git。

GitHub 是一种将 Git 用作其核心技术的云平台。 它简化了协作处理项目的过程，提供了网络、命令行工具，以及可使开发人员和用户一起工作的总体流程。 GitHub 充当前面在 Git 部分中提到的“远程存储库”。


在本书中，你需要使用命令行窗口来执行许多操作。你可以使用 Windows 下的 CMD.exe，或是 macOS 和 Linux 下的终端（Terminal）。其他常用的命令还有 cd 命令，用来切换目录（change directory）；mkdir 命令用来创建目录（make directory）。

    $ mkdir watchlist
    $ cd watchlist
    
    
### 安装git
[Git](https://git-scm.com/)是一个流行的版本控制工具，我们可以用它来记录程序源码和文件的变动情况，或是在开发时进行多人协作，你可以把它看做一个代码变动备份工具
安装Git，
[Git简明教程](http://rogerdudler.github.io/git-guide/index.zh.html)
[Git简介](https://learn.microsoft.com/zh-cn/training/modules/intro-to-git/?WT.mc_id=OSS-MVP-5003485)

[Visual studio code](https://code.visualstudio.com/)
  
  
[Sublime Text](https://www.sublimetext.com/)

### git和GitHub连接
安装后可以在命令行先使用使用下面的命令查看版本，没有报错则表示已正确安装：

    $ git --version
    git version 2.17.1
    
为了让 Git 知道你是谁，以便在提交代码到版本仓库的时候进行记录，使用下面的命令设置你的信息：


    $ git config --global user.name "Grey Li"  # 替换成你的名字
    $ git config --global user.email "withlihui@gmail.com"  # 替换成你的邮箱地址

现在为我们的项目文件夹创建一个 Git 仓库，这会在我们的项目根目录创建一个 `.git `文件夹：


    $ git init
    Initialized empty Git repository in ~/watchlist/.git/

Git 默认会追踪项目文件夹（或者说代码仓库）里所有文件的变化，但是有些无关紧要的文件不需要记录变化，我们在项目根目录创建一个 .gitignore 文件，在文件中写入忽略文件的规则。因为文件内容比较简单，我们直接在命令行使用 nano 来创建：


    $ nano .gitignore
在 nano 编辑界面写入常见的可忽略文件规则：


    *.pyc
    *~
    __pycache__
    .DS_Store
    
使用 Control + O 和 Enter 键保存，然后按下 Control + X 键退出。在后续章节，对于简单的文件，都会使用 nano 创建，这部分操作你也可以使用编辑器的图形界面来完成。




[Docsify官网](https://docsify.js.org/#/)。
https://docsify.js.org/#/zh-cn/quickstart?id=%e5%88%9d%e5%a7%8b%e5%8c%96%e9%a1%b9%e7%9b%ae

部署到Github Pages
Github Pages官网入口：https://pages.github.com/

Markdown编辑器
Typora官网入口：https://www.typora.io/





### 将程序托管到 GitHub
这一步是可选的。将程序托管到 GitHub、GitLab 或是 BitBucket 等平台上，可以更方便地备份、协作和部署。这些托管平台作为 Git 服务器，你可以为本地仓库创建远程仓库。

首先要注册一个 GitHub 账户，点击访问[github注册页面](https://github.com/)，根据指示完成注册流程。登录备用。

你可以访问 Microsoft Learn 上的引导式教程[《GitHub 简介》](https://learn.microsoft.com/zh-cn/training/modules/introduction-to-github/?WT.mc_id=OSS-MVP-5003485)了解相关基础知识。

设置 SSH 密钥
一般情况下，当推送本地改动到远程仓库时，需要输入用户名和密码。因为传输通常是通过 SSH 加密，所以可以通过设置 SSH 密钥来省去验证账号的步骤。

首先使用下面的命令检查是否已经创建了 SSH 密钥：


    $ cat ~/.ssh/id_rsa.pub
如果显示“No such file or directory”，就使用下面的命令生成 SSH 密钥对，否则复制输出的值备用：


$ ssh-keygen
一路按下 Enter 采用默认值，最后会在用户根目录创建一个 .ssh 文件夹，其中包含两个文件，id_rsa 和 id_rsa.pub，前者是私钥，不能泄露出去，后者是公钥，用于认证身份，就是我们要保存到 GitHub 上的密钥值。再次使用前面提到的命令获得文件内容：


$ cat ~/.ssh/id_rsa.pub
ssh-rsa AAAAB3Nza...省略 N 个字符...3aph book@greyli
选中并复制输出的内容，访问 GitHub 的 SSH 设置页面（导航栏头像 - Settings - SSH and GPG keys），点击 New SSH key 按钮，将复制的内容粘贴到 Key 输入框里，再填一个标题，比如“My PC”，最后点击“Add SSH key”按钮保存。

创建远程仓库¶
访问[新建仓库页面](https://github.com/new)（导航栏“+” - New repository），在“Repository name”处填写仓库名称，这里填“watchlist”即可，接着选择仓库类型（公开或私有）等选项，最后点击“Create repository”按钮创建仓库。

因为我们已经提前创建了本地仓库，所以需要指定本地仓库的远程仓库地址：


    $ git remote add origin git@github.com:greyli/watchlist.git  # 注意更换地址中的用户名
    
这会为本地仓库关联一个名为“origin”的远程仓库，注意将仓库地址中的“greyli”换成你的 GitHub 用户名。

如果还没有创建本地仓库，则可以直接将远程仓库克隆到本地（这会在当前目录创建一个名为 watchlist 的文件夹）：


    $ git clone git@github.com:greyli/watchlist.git  # 注意更换地址中的用户名
    
    
 每当有了新的变化，我们都可以提交到GitHub上面。
 当你进行到这里，就意味这我们已经做好学习和开发 Flask 程序的全部准备了。使用 git status 命令可以查看当前仓库的文件变动状态：

    $ git status
    
下面让我们将文件改动提交进 Git 仓库，并推送到在 GitHub 上创建的远程仓库：


    $ git add .
    $ git commit -m "I'm ready!"
    $ git push -u origin master # 如果你没有把仓库托管到 GitHub，则跳过这条命令，后面章节亦同
    
这里最后一行命令添加了`-u` 参数，会将推送的目标仓库和分支设为默认值，后续的推送直接使用 `git push `命令即可。在 GitHub 上，你可以通过 https://github.com/你的用户名/watchlist 查看你的仓库内容。




# 第二章：Markdown语法

[Markdown基础教程](https://www.runoob.com/markdown/md-link.html) —— （https://www.runoob.com/markdown/md-link.html）
你要学会markdown 语言。
如果没有照片插入，直接就GitHub编辑就可以，如果有照片就要拉取到本地操作。
***
标题

            # 一级标题
            ## 二级标题
            ### 三级标题
            


加粗
            
            **加粗的内容**，没有加粗不带星号。 


最重要的就是图片，图片的Markdown格式是这样的`[]()!`多了一个`!`符号。我们应该把所有的图片文件放在一个文件夹，然后push（上传）到GitHub上面。
