// https://pintia.cn/problem-sets/2003348658545209344/exam/problems/type/7?problemSetProblemId=2005559088673099782
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    string str;
    cin >> n >> str;

    int op;
    char c1, c2;
    string a, b;
    for (int i = 0; i < n; ++i)
    {
        cin >> op;
        // 1. 查找子串
        if (op == 1)
        {
            cin >> a;
            int idx = str.find(a);
            cout << (idx != string::npos ? idx : -1) << endl;
        }
        // 2. 替换第一次出现的子串
        else if (op == 2)
        {
            cin >> a >> b;
            int idx = str.find(a);
            if (idx != string::npos)
                str.replace(idx, a.size(), b);
            cout << str << endl;
        }
        // 3. 在c1c2子串前插入a
        else
        {
            cin >> c1 >> c2 >> a;
            for (int i = str.size() - 2; i >= 0; --i)
                if (str[i] == c1 && str[i + 1] == c2)
                    str.insert(i + 1, a);
            cout << str << endl;
        }
    }
}
