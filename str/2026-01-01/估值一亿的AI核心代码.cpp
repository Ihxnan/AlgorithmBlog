// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=1111914599412858885
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    cin.get(); // 跳过一个空格

    string str;
    while (getline(cin, str))
    {
        cout << str << endl;                                       // 输出原句子
        cout << "AI: ";                                            // 输出AI的回复
        str = regex_replace(str, regex(R"(^ +| +$| (?=\W))"), ""); // 去除句子两端的空格和中间的多余的空格
        // 转换成小写
        for (auto &p : str)
            if (p != 'I')
                p = tolower(p);
        str = regex_replace(str, regex(R"(\bcan you\b)"), "ii can");     // 把"can you"替换成"ii can"
        str = regex_replace(str, regex(R"(\bcould you\b)"), "ii could"); // 把"could you"替换成"ii could"
        str = regex_replace(str, regex(R"(\b(I|me)\b)"), "you");         // 把"I"替换成"you"
        str = regex_replace(str, regex(R"(\?)"), "!");                   // 把"?"替换成"!"
        str = regex_replace(str, regex(R"(\bii\b)"), "I");               // 把"ii"替换成"I"
        cout << str << endl;
    }
}
