![](images/008_Image_1.jpg)

### github-book

github 上写本书。
## 章节安排
第一章：一个GitHub账户。
第二章：Markdown语法
第三章：git版本控制


# 第一章：一个GitHub账户。
账户名直接是自己的名字。
如果设置了自己的名字，那么就是名字. github. io。然后在setting 设置里可以做一些操作，自己去看。

这就是你的网址。


# 第二章：Markdown语法
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

# 第三章：使用 Git
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
