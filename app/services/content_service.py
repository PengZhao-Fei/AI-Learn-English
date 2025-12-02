import requests
from bs4 import BeautifulSoup

class ContentService:
    def fetch_url(self, url: str) -> dict:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 使用简单启发式方法查找主标题和内容
            title = soup.title.string if soup.title else "无标题"
            
            # 尝试查找文章主体
            # 这是通用方法;特定网站可能需要特定的选择器
            article = soup.find('article')
            if not article:
                article = soup.find('main')
            if not article:
                article = soup.body
                
            # 提取文本段落
            paragraphs = [p.get_text().strip() for p in article.find_all('p') if p.get_text().strip()]
            content = "\n\n".join(paragraphs)
            
            return {
                "title": title,
                "content": content
            }
        except Exception as e:
            print(f"获取URL时出错: {e}")
            return None

content_service = ContentService()
